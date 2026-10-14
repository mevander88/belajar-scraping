package server

import (
	"context"
	"errors"
	"log"
	"strconv"
	"time"
	"unicode/utf8"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/mevander88/belajar-scraping/backend/internal/database"
	"github.com/mevander88/belajar-scraping/backend/internal/scraper"
	"gorm.io/gorm"
)

type healthResponse struct {
	Status    string   `json:"status"`
	Service   string   `json:"service"`
	Database  string   `json:"database,omitempty"`
	Redis     string   `json:"redis,omitempty"`
	Message   []string `json:"message,omitempty"`
	Timestamp string   `json:"timestamp"`
}

type CacheHealth interface {
	Ping(context.Context) error
}

type ScrapingService interface {
	Get(context.Context, scraper.Request) (scraper.Response, error)
}

type StreamResolver interface {
	ResolveStream(context.Context, string, string, bool) (scraper.MediaStream, error)
}

type Dependencies struct {
	Database       *gorm.DB
	Cache          CacheHealth
	Scraping       ScrapingService
	Streams        StreamResolver
	AllowedOrigins []string
}

func New(db *gorm.DB, allowedOrigins []string) *fiber.App {
	return NewWithDependencies(Dependencies{Database: db, AllowedOrigins: allowedOrigins})
}

func NewWithDependencies(dependencies Dependencies) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "Belajar Scraping API",
		UnescapePath: true,
		ErrorHandler: func(c fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			message := "internal server error"
			var fiberError *fiber.Error
			if errors.As(err, &fiberError) {
				code = fiberError.Code
				message = fiberError.Message
			}
			return c.Status(code).JSON(fiber.Map{"status": "error", "message": message})
		},
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{AllowOrigins: dependencies.AllowedOrigins}))

	api := app.Group("/api/v1")
	api.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(healthResponse{
			Status: "ok", Service: "belajar-scraping-api",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
	})

	api.Get("/ready", func(c fiber.Ctx) error {
		databaseStatus := "connected"
		redisStatus := "connected"
		var messages []string
		if err := database.Ping(dependencies.Database); err != nil {
			databaseStatus = "disconnected"
			messages = append(messages, err.Error())
		}
		if dependencies.Cache == nil {
			redisStatus = "disconnected"
			messages = append(messages, "Redis connection is not configured")
		} else if err := dependencies.Cache.Ping(c.Context()); err != nil {
			redisStatus = "disconnected"
			messages = append(messages, err.Error())
		}
		if len(messages) > 0 {
			return c.JSON(healthResponse{
				Status: "degraded", Service: "belajar-scraping-api", Database: databaseStatus, Redis: redisStatus,
				Message: messages, Timestamp: time.Now().UTC().Format(time.RFC3339),
			})
		}
		return c.JSON(healthResponse{
			Status: "ready", Service: "belajar-scraping-api", Database: databaseStatus, Redis: redisStatus,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
	})

	source := api.Group("/source")
	source.Get("/home", scrapeHandler(dependencies.Scraping, scraper.KindHome, false))
	source.Get("/catalog", scrapeHandler(dependencies.Scraping, scraper.KindCatalog, false))
	source.Get("/schedule", scrapeHandler(dependencies.Scraping, scraper.KindSchedule, false))
	source.Get("/genres", scrapeHandler(dependencies.Scraping, scraper.KindGenres, false))
	source.Get("/search", searchHandler(dependencies.Scraping))
	source.Get("/genres/:slug", scrapeHandler(dependencies.Scraping, scraper.KindGenre, true))
	source.Get("/anime", animeCollectionHandler(dependencies.Scraping))
	source.Get("/anime/:slug", scrapeHandler(dependencies.Scraping, scraper.KindAnime, true))
	source.Get("/episodes/:slug", scrapeHandler(dependencies.Scraping, scraper.KindEpisode, true))
	source.Get("/episodes/:slug/streams/:server", streamHandler(dependencies.Streams))

	return app
}

func streamHandler(resolver StreamResolver) fiber.Handler {
	return func(c fiber.Ctx) error {
		if resolver == nil {
			return fiber.NewError(fiber.StatusServiceUnavailable, "layanan video belum tersedia")
		}
		stream, err := resolver.ResolveStream(c.Context(), c.Params("slug"), c.Params("server"), c.Query("refresh") == "true")
		if err != nil {
			log.Printf("stream resolution failed slug=%q server=%q category=%s: %v", c.Params("slug"), c.Params("server"), scrapingErrorCategory(err), err)
			switch {
			case errors.Is(err, scraper.ErrInvalidRequest):
				return fiber.NewError(fiber.StatusBadRequest, "pilihan server video tidak valid")
			case errors.Is(err, scraper.ErrNotFound):
				return fiber.NewError(fiber.StatusNotFound, "episode tidak ditemukan pada website sumber")
			case errors.Is(err, scraper.ErrStreamUnsupported):
				return fiber.NewError(fiber.StatusUnprocessableEntity, "server ini tidak menyediakan media langsung yang didukung")
			case errors.Is(err, context.DeadlineExceeded):
				return fiber.NewError(fiber.StatusGatewayTimeout, "server video melewati batas waktu")
			default:
				return fiber.NewError(fiber.StatusBadGateway, "media langsung belum dapat dimuat")
			}
		}
		return c.JSON(stream)
	}
}

func searchHandler(service ScrapingService) fiber.Handler {
	return func(c fiber.Ctx) error {
		query := scraper.NormalizeSearchQuery(c.Query("query"))
		if query == "" || utf8.RuneCountInString(query) > scraper.MaxSearchQueryRunes {
			return fiber.NewError(fiber.StatusBadRequest, "parameter query wajib diisi dan maksimal 100 karakter")
		}
		return respondWithScraping(c, service, scraper.Request{
			Kind:  scraper.KindSearch,
			Query: query,
			Page:  1,
		})
	}
}

func scrapeHandler(service ScrapingService, kind scraper.ContentKind, needsSlug bool) fiber.Handler {
	return func(c fiber.Ctx) error {
		page, err := requestPage(c)
		if err != nil {
			return err
		}
		request := scraper.Request{Kind: kind, Page: page}
		if needsSlug {
			request.Slug = c.Params("slug")
		}
		return respondWithScraping(c, service, request)
	}
}

func animeCollectionHandler(service ScrapingService) fiber.Handler {
	return func(c fiber.Ctx) error {
		page, err := requestPage(c)
		if err != nil {
			return err
		}
		var kind scraper.ContentKind
		switch c.Query("status") {
		case "ongoing":
			kind = scraper.KindOngoing
		case "complete":
			kind = scraper.KindComplete
		default:
			return fiber.NewError(fiber.StatusBadRequest, "status must be ongoing or complete")
		}
		return respondWithScraping(c, service, scraper.Request{Kind: kind, Page: page})
	}
}

func requestPage(c fiber.Ctx) (int, error) {
	rawPage := c.Query("page", "1")
	page, err := strconv.Atoi(rawPage)
	if err != nil || page < 1 || page > scraper.MaxPage {
		return 0, fiber.NewError(fiber.StatusBadRequest, "page must be between 1 and 1000")
	}
	return page, nil
}

func respondWithScraping(c fiber.Ctx, service ScrapingService, request scraper.Request) error {
	if service == nil {
		return fiber.NewError(fiber.StatusServiceUnavailable, "scraping service is unavailable")
	}
	response, err := service.Get(c.Context(), request)
	if err != nil {
		log.Printf(
			"scraping request failed kind=%s slug=%q query=%q page=%d category=%s: %v",
			request.Kind, request.Slug, request.Query, request.Page, scrapingErrorCategory(err), err,
		)
		return mapScrapingError(err)
	}
	return c.JSON(response)
}

func mapScrapingError(err error) error {
	switch {
	case errors.Is(err, scraper.ErrInvalidRequest):
		return fiber.NewError(fiber.StatusBadRequest, "parameter request scraping tidak valid")
	case errors.Is(err, scraper.ErrNotFound):
		return fiber.NewError(fiber.StatusNotFound, "konten tidak ditemukan pada website sumber")
	case errors.Is(err, context.DeadlineExceeded):
		return fiber.NewError(fiber.StatusGatewayTimeout, "website sumber melewati batas waktu")
	case errors.Is(err, scraper.ErrUpstream):
		return fiber.NewError(fiber.StatusBadGateway, "website sumber tidak dapat diakses")
	case errors.Is(err, scraper.ErrInvalidContent):
		return fiber.NewError(fiber.StatusBadGateway, "struktur website sumber tidak dapat diproses")
	default:
		return fiber.NewError(fiber.StatusInternalServerError, "internal server error")
	}
}

func scrapingErrorCategory(err error) string {
	switch {
	case errors.Is(err, scraper.ErrInvalidRequest):
		return "invalid_request"
	case errors.Is(err, scraper.ErrNotFound):
		return "not_found"
	case errors.Is(err, context.DeadlineExceeded):
		return "timeout"
	case errors.Is(err, scraper.ErrUpstream):
		return "upstream"
	case errors.Is(err, scraper.ErrInvalidContent):
		return "invalid_content"
	case errors.Is(err, scraper.ErrStreamUnsupported):
		return "stream_unsupported"
	case errors.Is(err, scraper.ErrStreamUnavailable):
		return "stream_unavailable"
	default:
		return "internal"
	}
}
