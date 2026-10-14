package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/mevander88/belajar-scraping/backend/internal/cache"
	"github.com/mevander88/belajar-scraping/backend/internal/config"
	"github.com/mevander88/belajar-scraping/backend/internal/database"
	"github.com/mevander88/belajar-scraping/backend/internal/scraper"
	"github.com/mevander88/belajar-scraping/backend/internal/scraping"
	"github.com/mevander88/belajar-scraping/backend/internal/server"
)

func main() {
	cfg := config.Load()

	db, err := database.Open(cfg.DatabaseURL)
	if err != nil {
		log.Printf("database unavailable: %v", err)
	} else {
		log.Println("database connection established")
		if err := database.Migrate(db); err != nil {
			log.Fatalf("database migration failed: %v", err)
		}
		log.Println("database migration completed")
	}

	cacheContext, cancelCacheConnect := context.WithTimeout(context.Background(), 3*time.Second)
	redisStore, err := cache.Open(cacheContext, cfg.RedisURL, cfg.RedisKeyPrefix)
	cancelCacheConnect()
	if err != nil {
		log.Printf("Redis unavailable; scraping will continue without cache: %v", err)
		redisStore = nil
	} else {
		log.Println("Redis connection established")
		defer redisStore.Close()
	}
	var scrapingCache scraping.Cache
	var cacheHealth server.CacheHealth
	if redisStore != nil {
		scrapingCache = redisStore
		cacheHealth = redisStore
	}

	source, err := scraper.NewWithConfig(
		cfg.SourceURL,
		&http.Client{Timeout: cfg.ScraperTimeout},
		cfg.ScraperDelay,
	)
	if err != nil {
		log.Fatalf("configure scraping source: %v", err)
	}
	scrapingService := scraping.New(source, scrapingCache, scraping.Policy{
		TTL: map[scraper.ContentKind]time.Duration{
			scraper.KindHome:     cfg.CacheTTLHome,
			scraper.KindCatalog:  cfg.CacheTTLCatalog,
			scraper.KindSchedule: cfg.CacheTTLSchedule,
			scraper.KindGenres:   cfg.CacheTTLGenres,
			scraper.KindOngoing:  cfg.CacheTTLCollection,
			scraper.KindComplete: cfg.CacheTTLCollection,
			scraper.KindGenre:    cfg.CacheTTLCollection,
			scraper.KindSearch:   cfg.CacheTTLSearch,
			scraper.KindAnime:    cfg.CacheTTLAnime,
			scraper.KindEpisode:  cfg.CacheTTLEpisode,
		},
		CompleteAnimeTTL: cfg.CacheTTLAnimeComplete,
		StaleTTL:         cfg.CacheStaleTTL,
	})

	app := server.NewWithDependencies(server.Dependencies{
		Database: db, Cache: cacheHealth, Scraping: scrapingService, AllowedOrigins: cfg.AllowedOrigins,
	})
	address := ":" + cfg.Port
	log.Printf("API listening on http://localhost%s", address)

	if err := app.Listen(address); err != nil {
		log.Fatalf("API stopped: %v", err)
	}
}
