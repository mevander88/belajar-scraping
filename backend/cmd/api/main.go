package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/mevander88/belajar-scraping/backend/internal/cache"
	"github.com/mevander88/belajar-scraping/backend/internal/capacity"
	"github.com/mevander88/belajar-scraping/backend/internal/config"
	"github.com/mevander88/belajar-scraping/backend/internal/database"
	"github.com/mevander88/belajar-scraping/backend/internal/scraper"
	"github.com/mevander88/belajar-scraping/backend/internal/scraping"
	"github.com/mevander88/belajar-scraping/backend/internal/server"
	"github.com/mevander88/belajar-scraping/backend/internal/streaming"
)

func main() {
	cfg := config.Load()

	db, err := database.Open(cfg.DatabaseURL)
	if err != nil {
		log.Printf("database unavailable: %v", err)
	} else {
		if err := database.ConfigurePool(db, cfg.DatabaseMaxOpenConns, cfg.DatabaseMaxIdleConns, cfg.DatabaseConnLifetime, cfg.DatabaseConnIdleTime); err != nil {
			log.Printf("configure database pool: %v", err)
		}
		log.Println("database connection established")
		if err := database.Migrate(db); err != nil {
			log.Printf("database migration failed: %v", err)
			if closeErr := database.Close(db); closeErr != nil {
				log.Printf("close unusable database connection: %v", closeErr)
			}
			db = nil
		} else {
			log.Println("database migration completed")
			defer func() {
				if err := database.Close(db); err != nil {
					log.Printf("close database: %v", err)
				}
			}()
		}
	}

	cacheContext, cancelCacheConnect := context.WithTimeout(context.Background(), 3*time.Second)
	redisStore, err := cache.Open(cacheContext, cfg.RedisURL, cfg.RedisKeyPrefix, cfg.RedisPoolSize)
	cancelCacheConnect()
	redisReady := false
	if err != nil {
		log.Printf("Redis configuration invalid; scraping will continue without cache: %v", err)
		redisStore = nil
	} else {
		if pingErr := redisStore.Ping(context.Background()); pingErr != nil {
			log.Printf("Redis unavailable; client will keep reconnecting: %v", pingErr)
		} else {
			redisReady = true
			log.Println("Redis connection established")
		}
		defer redisStore.Close()
	}
	localCache := cache.NewMemory(cfg.LocalCacheMaxBytes)
	var scrapingCache scraping.Cache = cache.NewTiered(redisStore, localCache, redisReady)
	var cacheHealth server.CacheHealth
	if redisStore != nil {
		cacheHealth = redisStore
	}

	source, err := scraper.NewWithConfig(
		cfg.SourceURL,
		&http.Client{Timeout: cfg.ScraperTimeout},
		cfg.ScraperDelay,
	)
	if err != nil {
		log.Printf("configure scraping source: %v", err)
		return
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
		Limiter:          capacity.New(cfg.ScrapeMaxConcurrency, cfg.ScrapeMaxQueue),
	})
	streamingService := streaming.New(source, scrapingCache, cfg.CacheTTLStream, cfg.StreamResolveTimeout, capacity.New(cfg.StreamMaxConcurrency, cfg.StreamMaxQueue))

	app := server.NewWithDependencies(server.Dependencies{
		Database: db, Cache: cacheHealth, Scraping: scrapingService, Streams: streamingService, AllowedOrigins: cfg.AllowedOrigins,
	})
	address := ":" + cfg.Port
	log.Printf("API listening on http://localhost%s", address)

	listenErrors := make(chan error, 1)
	go func() {
		listenErrors <- app.Listen(address)
	}()

	shutdownSignal, stopSignals := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stopSignals()
	select {
	case err := <-listenErrors:
		if err != nil {
			log.Printf("API stopped: %v", err)
		}
	case <-shutdownSignal.Done():
		shutdownContext, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelShutdown()
		if err := app.ShutdownWithContext(shutdownContext); err != nil {
			log.Printf("graceful shutdown failed: %v", err)
		}
		select {
		case err := <-listenErrors:
			if err != nil {
				log.Printf("API stopped: %v", err)
			}
		case <-shutdownContext.Done():
			log.Printf("API shutdown wait exceeded deadline: %v", shutdownContext.Err())
		}
	}
}
