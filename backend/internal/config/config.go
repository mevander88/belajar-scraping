package config

import (
	"os"
	"strconv"
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
	CacheTTLSearch        time.Duration
	CacheTTLAnime         time.Duration
	CacheTTLAnimeComplete time.Duration
	CacheTTLEpisode       time.Duration
	CacheTTLStream        time.Duration
	StreamResolveTimeout  time.Duration
	ScrapeMaxConcurrency  int
	ScrapeMaxQueue        int
	StreamMaxConcurrency  int
	StreamMaxQueue        int
	DatabaseMaxOpenConns  int
	DatabaseMaxIdleConns  int
	DatabaseConnLifetime  time.Duration
	DatabaseConnIdleTime  time.Duration
	RedisPoolSize         int
	LocalCacheMaxBytes    int
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
		CacheTTLSearch:        durationOrDefault("CACHE_TTL_SEARCH", 10*time.Minute),
		CacheTTLAnime:         durationOrDefault("CACHE_TTL_ANIME", time.Hour),
		CacheTTLAnimeComplete: durationOrDefault("CACHE_TTL_ANIME_COMPLETE", 12*time.Hour),
		CacheTTLEpisode:       durationOrDefault("CACHE_TTL_EPISODE", 5*time.Minute),
		CacheTTLStream:        durationOrDefault("CACHE_TTL_STREAM", 3*time.Minute),
		StreamResolveTimeout:  durationOrDefault("STREAM_RESOLVE_TIMEOUT", 25*time.Second),
		ScrapeMaxConcurrency:  intOrDefault("SCRAPE_MAX_CONCURRENCY", 4),
		ScrapeMaxQueue:        intOrDefault("SCRAPE_MAX_QUEUE", 32),
		StreamMaxConcurrency:  intOrDefault("STREAM_RESOLVE_MAX_CONCURRENCY", 2),
		StreamMaxQueue:        intOrDefault("STREAM_RESOLVE_MAX_QUEUE", 16),
		DatabaseMaxOpenConns:  intOrDefault("DATABASE_MAX_OPEN_CONNS", 10),
		DatabaseMaxIdleConns:  intOrDefault("DATABASE_MAX_IDLE_CONNS", 5),
		DatabaseConnLifetime:  durationOrDefault("DATABASE_CONN_MAX_LIFETIME", 30*time.Minute),
		DatabaseConnIdleTime:  durationOrDefault("DATABASE_CONN_MAX_IDLE_TIME", 5*time.Minute),
		RedisPoolSize:         intOrDefault("REDIS_POOL_SIZE", 10),
		LocalCacheMaxBytes:    intOrDefault("LOCAL_CACHE_MAX_BYTES", 16<<20),
		AllowedOrigins:        splitAndTrim(valueOrDefault("CORS_ALLOWED_ORIGINS", "http://localhost:3000")),
	}
}

func intOrDefault(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	parsed, err := strconv.Atoi(value)
	if value == "" || err != nil || parsed < 0 {
		return fallback
	}
	return parsed
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
