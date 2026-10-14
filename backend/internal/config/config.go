package config

import (
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                  string
	DatabaseURL           string
	RedisURL              string
	RedisKeyPrefix        string
	SourceURL             string
	ScraperTimeout        time.Duration
	ScraperDelay          time.Duration
	CacheStaleTTL         time.Duration
	CacheTTLHome          time.Duration
	CacheTTLCatalog       time.Duration
	CacheTTLSchedule      time.Duration
	CacheTTLGenres        time.Duration
	CacheTTLCollection    time.Duration
	CacheTTLAnime         time.Duration
	CacheTTLAnimeComplete time.Duration
	CacheTTLEpisode       time.Duration
	AllowedOrigins        []string
}

func Load() Config {
	_ = godotenv.Load()

	return Config{
		Port:                  valueOrDefault("PORT", "8080"),
		DatabaseURL:           valueOrDefault("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/belajar_scraping?sslmode=disable"),
		RedisURL:              valueOrDefault("REDIS_URL", "redis://localhost:6379/0"),
		RedisKeyPrefix:        valueOrDefault("REDIS_KEY_PREFIX", "belajar-scraping"),
		SourceURL:             valueOrDefault("SCRAPER_SOURCE_URL", "https://otakudesu.blog"),
		ScraperTimeout:        durationOrDefault("SCRAPER_TIMEOUT", 20*time.Second),
		ScraperDelay:          durationOrDefault("SCRAPER_REQUEST_DELAY", 750*time.Millisecond),
		CacheStaleTTL:         durationOrDefault("CACHE_STALE_TTL", 24*time.Hour),
		CacheTTLHome:          durationOrDefault("CACHE_TTL_HOME", 5*time.Minute),
		CacheTTLCatalog:       durationOrDefault("CACHE_TTL_CATALOG", 6*time.Hour),
		CacheTTLSchedule:      durationOrDefault("CACHE_TTL_SCHEDULE", 15*time.Minute),
		CacheTTLGenres:        durationOrDefault("CACHE_TTL_GENRES", 12*time.Hour),
		CacheTTLCollection:    durationOrDefault("CACHE_TTL_COLLECTION", 10*time.Minute),
		CacheTTLAnime:         durationOrDefault("CACHE_TTL_ANIME", time.Hour),
		CacheTTLAnimeComplete: durationOrDefault("CACHE_TTL_ANIME_COMPLETE", 12*time.Hour),
		CacheTTLEpisode:       durationOrDefault("CACHE_TTL_EPISODE", 5*time.Minute),
		AllowedOrigins:        splitAndTrim(valueOrDefault("CORS_ALLOWED_ORIGINS", "http://localhost:3000")),
	}
}

func valueOrDefault(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func splitAndTrim(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

func durationOrDefault(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	duration, err := time.ParseDuration(value)
	if err != nil || duration <= 0 {
		return fallback
	}
	return duration
}
