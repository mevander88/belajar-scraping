package scraping

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"strconv"
	"time"

	"github.com/mevander88/belajar-scraping/backend/internal/scraper"
)

const defaultTTL = 30 * time.Minute

type Source interface {
	Run(context.Context, scraper.Request) (scraper.Response, error)
}

type Cache interface {
	Get(context.Context, string, bool) ([]byte, bool, error)
	Set(context.Context, string, []byte, time.Duration, time.Duration) error
}

type Policy struct {
	TTL              map[scraper.ContentKind]time.Duration
	CompleteAnimeTTL time.Duration
	StaleTTL         time.Duration
}

type Service struct {
	source Source
	cache  Cache
	policy Policy
}

func New(source Source, cache Cache, policy Policy) *Service {
	return &Service{source: source, cache: cache, policy: policy}
}

func (s *Service) Get(ctx context.Context, request scraper.Request) (scraper.Response, error) {
	if request.Page == 0 {
		request.Page = 1
	}
	if err := scraper.ValidateRequest(request); err != nil {
		return scraper.Response{}, err
	}
	if s == nil || s.source == nil {
		return scraper.Response{}, fmt.Errorf("scraping source is not configured")
	}

	key := cacheKey(request)
	cacheAvailable := s.cache != nil
	if cacheAvailable {
		payload, found, err := s.cache.Get(ctx, key, false)
		if err != nil {
			cacheAvailable = false
			log.Printf("scraping cache read failed for %s: %v", key, err)
		} else if found {
			response, decodeErr := decodeResponse(payload)
			if decodeErr == nil {
				response.Meta.Cache = "hit"
				return response, nil
			}
			log.Printf("scraping cache payload invalid for %s: %v", key, decodeErr)
		}
	}

	response, sourceErr := s.source.Run(ctx, request)
	if sourceErr != nil {
		if s.cache != nil {
			payload, found, cacheErr := s.cache.Get(ctx, key, true)
			if cacheErr != nil {
				log.Printf("scraping stale cache read failed for %s: %v", key, cacheErr)
			} else if found {
				staleResponse, decodeErr := decodeResponse(payload)
				if decodeErr == nil {
					staleResponse.Meta.Cache = "stale"
					staleResponse.Meta.Warnings = append(staleResponse.Meta.Warnings, "website sumber tidak tersedia; data cache lama digunakan")
					return staleResponse, nil
				}
				log.Printf("scraping stale cache payload invalid for %s: %v", key, decodeErr)
			}
		}
		return scraper.Response{}, sourceErr
	}

	response.Meta.Cache = "miss"
	if !cacheAvailable {
		response.Meta.Cache = "bypass"
		response.Meta.Warnings = append(response.Meta.Warnings, "Redis tidak tersedia; hasil tidak disimpan ke cache")
		return response, nil
	}

	payload, err := json.Marshal(response)
	if err != nil {
		return scraper.Response{}, fmt.Errorf("encode scraping response: %w", err)
	}
	if err := s.cache.Set(ctx, key, payload, s.ttl(request.Kind, response), s.policy.StaleTTL); err != nil {
		log.Printf("scraping cache write failed for %s: %v", key, err)
		response.Meta.Cache = "bypass"
		response.Meta.Warnings = append(response.Meta.Warnings, "hasil berhasil diambil tetapi gagal disimpan ke Redis")
	}
	return response, nil
}

func (s *Service) ttl(kind scraper.ContentKind, response scraper.Response) time.Duration {
	if kind == scraper.KindAnime && s.policy.CompleteAnimeTTL > 0 {
		if detail, ok := response.Data.(scraper.AnimeDetail); ok && detail.Status == "complete" {
			return s.policy.CompleteAnimeTTL
		}
	}
	if ttl := s.policy.TTL[kind]; ttl > 0 {
		return ttl
	}
	return defaultTTL
}

func cacheKey(request scraper.Request) string {
	return "source:" + string(request.Kind) + ":" + url.QueryEscape(request.Slug) + ":page:" + strconv.Itoa(request.Page)
}

func decodeResponse(payload []byte) (scraper.Response, error) {
	var response scraper.Response
	if err := json.Unmarshal(payload, &response); err != nil {
		return scraper.Response{}, fmt.Errorf("decode scraping cache: %w", err)
	}
	if response.Meta.Kind == "" || response.Meta.SourceURL == "" || response.Data == nil {
		return scraper.Response{}, fmt.Errorf("decode scraping cache: required fields are missing")
	}
	return response, nil
}
