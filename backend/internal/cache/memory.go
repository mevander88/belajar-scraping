package cache

import (
	"context"
	"log"
	"sync"
	"time"
)

type memoryEntry struct {
	value      []byte
	freshUntil time.Time
	staleUntil time.Time
	usedSeq    uint64
}

type MemoryStore struct {
	mu       sync.Mutex
	entries  map[string]memoryEntry
	bytes    int
	maxBytes int
	sequence uint64
}

func NewMemory(maxBytes int) *MemoryStore {
	if maxBytes < 0 {
		maxBytes = 0
	}
	return &MemoryStore{entries: make(map[string]memoryEntry), maxBytes: maxBytes}
}

func (s *MemoryStore) Get(_ context.Context, key string, stale bool) ([]byte, bool, error) {
	if s == nil || s.maxBytes == 0 {
		return nil, false, nil
	}
	now := time.Now()
	s.mu.Lock()
	defer s.mu.Unlock()
	entry, ok := s.entries[key]
	if !ok {
		return nil, false, nil
	}
	deadline := entry.freshUntil
	if stale {
		deadline = entry.staleUntil
	}
	if !now.Before(deadline) {
		if stale || !now.Before(entry.staleUntil) {
			s.bytes -= len(entry.value)
			delete(s.entries, key)
		}
		return nil, false, nil
	}
	s.sequence++
	entry.usedSeq = s.sequence
	s.entries[key] = entry
	return append([]byte(nil), entry.value...), true, nil
}

func (s *MemoryStore) Set(_ context.Context, key string, value []byte, freshTTL, staleTTL time.Duration) error {
	if s == nil || s.maxBytes == 0 || len(value) > s.maxBytes {
		return nil
	}
	now := time.Now()
	s.mu.Lock()
	defer s.mu.Unlock()
	if old, ok := s.entries[key]; ok {
		s.bytes -= len(old.value)
	}
	copyValue := append([]byte(nil), value...)
	s.sequence++
	s.entries[key] = memoryEntry{value: copyValue, freshUntil: now.Add(freshTTL), staleUntil: now.Add(freshTTL + staleTTL), usedSeq: s.sequence}
	s.bytes += len(copyValue)
	for s.bytes > s.maxBytes {
		oldestKey := ""
		var oldest uint64
		for candidate, entry := range s.entries {
			if oldestKey == "" || entry.usedSeq < oldest {
				oldestKey, oldest = candidate, entry.usedSeq
			}
		}
		old := s.entries[oldestKey]
		s.bytes -= len(old.value)
		delete(s.entries, oldestKey)
	}
	return nil
}

type TieredStore struct {
	primary       *Store
	local         *MemoryStore
	mu            sync.Mutex
	degraded      bool
	probeInFlight bool
	retryAt       time.Time
}

func NewTiered(primary *Store, local *MemoryStore, primaryAvailable ...bool) *TieredStore {
	store := &TieredStore{primary: primary, local: local}
	if primary != nil && len(primaryAvailable) > 0 && !primaryAvailable[0] {
		store.degraded = true
		store.retryAt = time.Now().Add(5 * time.Second)
	}
	return store
}

func (s *TieredStore) allowPrimary() bool {
	if s.primary == nil {
		return false
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if !s.degraded {
		return true
	}
	if s.probeInFlight || time.Now().Before(s.retryAt) {
		return false
	}
	s.probeInFlight = true
	return true
}

func (s *TieredStore) primaryDegraded() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.degraded
}

func (s *TieredStore) recordPrimary(err error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.probeInFlight = false
	if err == nil {
		s.degraded = false
		s.retryAt = time.Time{}
		return
	}
	s.degraded = true
	s.retryAt = time.Now().Add(5 * time.Second)
}

func (s *TieredStore) Get(ctx context.Context, key string, stale bool) ([]byte, bool, error) {
	if s.primaryDegraded() {
		if value, found, err := s.local.Get(ctx, key, stale); err != nil || found {
			return value, found, err
		}
	}
	if s.allowPrimary() {
		value, found, err := s.primary.Get(ctx, key, stale)
		s.recordPrimary(err)
		if err == nil && found {
			return value, true, nil
		}
		if err != nil {
			log.Printf("Redis cache read degraded for %s: %v", key, err)
		}
	}
	return s.local.Get(ctx, key, stale)
}

func (s *TieredStore) Set(ctx context.Context, key string, value []byte, freshTTL, staleTTL time.Duration) error {
	_ = s.local.Set(ctx, key, value, freshTTL, staleTTL)
	if s.allowPrimary() {
		if err := s.primary.Set(ctx, key, value, freshTTL, staleTTL); err != nil {
			s.recordPrimary(err)
			log.Printf("Redis cache write degraded for %s: %v", key, err)
		} else {
			s.recordPrimary(nil)
		}
	}
	return nil
}
