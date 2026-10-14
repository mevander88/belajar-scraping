package streaming

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"sync"
	"time"

	"github.com/mevander88/belajar-scraping/backend/internal/coalesce"
	"github.com/mevander88/belajar-scraping/backend/internal/scraper"
)

const maxLocalEntries = 256

type Source interface {
	ResolveStream(context.Context, string, string) (scraper.MediaStream, error)
}

type Cache interface {
	Get(context.Context, string, bool) ([]byte, bool, error)
	Set(context.Context, string, []byte, time.Duration, time.Duration) error
}

type localEntry struct {
	stream    scraper.MediaStream
	expiresAt time.Time
	storedAt  time.Time
}

type Service struct {
	source         Source
	cache          Cache
	ttl            time.Duration
	resolveTimeout time.Duration
	flights        coalesce.Group[string, scraper.MediaStream]
	localMu        sync.Mutex
	local          map[string]localEntry
}

func New(source Source, cache Cache, ttl, resolveTimeout time.Duration) *Service {
	return &Service{
		source: source, cache: cache, ttl: ttl, resolveTimeout: resolveTimeout,
		local: make(map[string]localEntry),
	}
}

func (s *Service) ResolveStream(ctx context.Context, slug, serverID string, refresh bool) (scraper.MediaStream, error) {
	if s == nil || s.source == nil {
		return scraper.MediaStream{}, fmt.Errorf("stream resolver is not configured")
	}
	if err := scraper.ValidateStreamRequest(slug, serverID); err != nil {
		return scraper.MediaStream{}, err
	}
	key := "stream:" + url.QueryEscape(slug) + ":" + url.QueryEscape(serverID)
	if !refresh {
		if stream, found := s.getLocal(key); found {
			return stream, nil
		}
		if stream, found := s.getShared(ctx, key); found {
			s.setLocal(key, stream)
			return stream, nil
		}
	}

	return s.flights.Do(ctx, key, func() (scraper.MediaStream, error) {
		if !refresh {
			if stream, found := s.getLocal(key); found {
				return stream, nil
			}
		}

		resolveContext := ctx
		cancel := func() {}
		if s.resolveTimeout > 0 {
			resolveContext, cancel = context.WithTimeout(ctx, s.resolveTimeout)
		}
		defer cancel()

		stream, err := s.source.ResolveStream(resolveContext, slug, serverID)
		if err != nil {
			return scraper.MediaStream{}, err
		}
		s.setLocal(key, stream)
		s.setShared(ctx, key, stream)
		return stream, nil
	})
}

func (s *Service) getShared(ctx context.Context, key string) (scraper.MediaStream, bool) {
	if s.cache == nil {
		return scraper.MediaStream{}, false
	}
	payload, found, err := s.cache.Get(ctx, key, false)
	if err != nil {
		log.Printf("stream cache read failed for %s: %v", key, err)
		return scraper.MediaStream{}, false
	}
	if !found {
		return scraper.MediaStream{}, false
	}
	var stream scraper.MediaStream
	if json.Unmarshal(payload, &stream) != nil || stream.URL == "" {
		return scraper.MediaStream{}, false
	}
	return stream, true
}

func (s *Service) setShared(ctx context.Context, key string, stream scraper.MediaStream) {
	if s.cache == nil || s.ttl <= 0 {
		return
	}
	payload, err := json.Marshal(stream)
	if err != nil {
		return
	}
	if err := s.cache.Set(ctx, key, payload, s.ttl, 0); err != nil {
		log.Printf("stream cache write failed for %s: %v", key, err)
	}
}

func (s *Service) getLocal(key string) (scraper.MediaStream, bool) {
	if s.ttl <= 0 {
		return scraper.MediaStream{}, false
	}
	now := time.Now()
	s.localMu.Lock()
	defer s.localMu.Unlock()
	entry, found := s.local[key]
	if !found {
		return scraper.MediaStream{}, false
	}
	if !now.Before(entry.expiresAt) {
		delete(s.local, key)
		return scraper.MediaStream{}, false
	}
	return entry.stream, true
}

func (s *Service) setLocal(key string, stream scraper.MediaStream) {
	if s.ttl <= 0 {
		return
	}
	now := time.Now()
	s.localMu.Lock()
	defer s.localMu.Unlock()
	for existingKey, entry := range s.local {
		if !now.Before(entry.expiresAt) {
			delete(s.local, existingKey)
		}
	}
	if len(s.local) >= maxLocalEntries {
		oldestKey := ""
		var oldest time.Time
		for existingKey, entry := range s.local {
			if oldestKey == "" || entry.storedAt.Before(oldest) {
				oldestKey, oldest = existingKey, entry.storedAt
			}
		}
		delete(s.local, oldestKey)
	}
	s.local[key] = localEntry{stream: stream, storedAt: now, expiresAt: now.Add(s.ttl)}
}
