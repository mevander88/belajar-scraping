package cache

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

type Store struct {
	client redis.UniversalClient
	prefix string
}

func Open(ctx context.Context, rawURL, prefix string) (*Store, error) {
	options, err := redis.ParseURL(rawURL)
	if err != nil {
		return nil, fmt.Errorf("parse Redis URL: %w", err)
	}
	client := redis.NewClient(options)
	store := &Store{client: client, prefix: strings.TrimSuffix(prefix, ":")}
	if err := store.Ping(ctx); err != nil {
		_ = client.Close()
		return nil, err
	}
	return store, nil
}

func (s *Store) Get(ctx context.Context, key string, stale bool) ([]byte, bool, error) {
	if s == nil || s.client == nil {
		return nil, false, fmt.Errorf("Redis is not configured")
	}
	value, err := s.client.Get(ctx, s.key(key, stale)).Bytes()
	if err == redis.Nil {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, fmt.Errorf("read Redis cache: %w", err)
	}
	return value, true, nil
}

func (s *Store) Set(ctx context.Context, key string, value []byte, freshTTL, staleTTL time.Duration) error {
	if s == nil || s.client == nil {
		return fmt.Errorf("Redis is not configured")
	}
	pipe := s.client.TxPipeline()
	pipe.Set(ctx, s.key(key, false), value, freshTTL)
	if staleTTL > 0 {
		pipe.Set(ctx, s.key(key, true), value, freshTTL+staleTTL)
	}
	if _, err := pipe.Exec(ctx); err != nil {
		return fmt.Errorf("write Redis cache: %w", err)
	}
	return nil
}

func (s *Store) Ping(ctx context.Context) error {
	if s == nil || s.client == nil {
		return fmt.Errorf("Redis connection is not configured")
	}
	pingContext, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	if err := s.client.Ping(pingContext).Err(); err != nil {
		return fmt.Errorf("ping Redis: %w", err)
	}
	return nil
}

func (s *Store) Close() error {
	if s == nil || s.client == nil {
		return nil
	}
	return s.client.Close()
}

func (s *Store) key(key string, stale bool) string {
	suffix := "fresh"
	if stale {
		suffix = "stale"
	}
	if s.prefix == "" {
		return key + ":" + suffix
	}
	return s.prefix + ":" + key + ":" + suffix
}
