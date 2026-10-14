package streaming

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"time"

	"github.com/mevander88/belajar-scraping/backend/internal/scraper"
)

type Source interface {
	ResolveStream(context.Context, string, string) (scraper.MediaStream, error)
}

type Cache interface {
	Get(context.Context, string, bool) ([]byte, bool, error)
	Set(context.Context, string, []byte, time.Duration, time.Duration) error
}

type Service struct {
	source Source
	cache  Cache
	ttl    time.Duration
}

func New(source Source, cache Cache, ttl time.Duration) *Service {
	return &Service{source: source, cache: cache, ttl: ttl}
}

func (s *Service) ResolveStream(ctx context.Context, slug, serverID string, refresh bool) (scraper.MediaStream, error) {
	if s == nil || s.source == nil {
		return scraper.MediaStream{}, fmt.Errorf("stream resolver is not configured")
	}
	key := "stream:" + url.QueryEscape(slug) + ":" + url.QueryEscape(serverID)
	if s.cache != nil && !refresh {
		if payload, found, err := s.cache.Get(ctx, key, false); err != nil {
			log.Printf("stream cache read failed for %s: %v", key, err)
		} else if found {
			var stream scraper.MediaStream
			if json.Unmarshal(payload, &stream) == nil && stream.URL != "" {
				return stream, nil
			}
		}
	}

	stream, err := s.source.ResolveStream(ctx, slug, serverID)
	if err != nil {
		return scraper.MediaStream{}, err
	}
	if s.cache != nil && s.ttl > 0 {
		payload, marshalErr := json.Marshal(stream)
		if marshalErr == nil {
			if cacheErr := s.cache.Set(ctx, key, payload, s.ttl, 0); cacheErr != nil {
				log.Printf("stream cache write failed for %s: %v", key, cacheErr)
			}
		}
	}
	return stream, nil
}
