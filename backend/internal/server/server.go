package server

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/mevander88/belajar-scraping/backend/internal/database"
	"github.com/mevander88/belajar-scraping/backend/internal/scraper"
	"gorm.io/gorm"
)

type healthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Database  string `json:"database,omitempty"`
	Redis     string `json:"redis,omitempty"`
	Timestamp string `json:"timestamp"`
}

type CacheHealth interface {
	Ping(context.Context) error
}

type ScrapingService interface {
	Get(context.Context, scraper.Request) (scraper.Response, error)
}

type Dependencies struct {
	Database       *gorm.DB
	Cache          CacheHealth
	Scraping       ScrapingService
	AllowedOrigins []string
}

func New(db *gorm.DB, allowedOrigins []string) *fiber.App {
	return NewWithDependencies(Dependencies{Database: db, AllowedOrigins: allowedOrigins})
}

func NewWithDependencies(dependencies Dependencies) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName: "Belajar Scraping API",
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
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"status": "unavailable", "database": databaseStatus, "redis": redisStatus, "message": messages,
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
	source.Get("/genres/:slug", scrapeHandler(dependencies.Scraping, scraper.KindGenre, true))
	source.Get("/anime", animeCollectionHandler(dependencies.Scraping))
	source.Get("/anime/:slug", scrapeHandler(dependencies.Scraping, scraper.KindAnime, true))
	source.Get("/episodes/:slug", scrapeHandler(dependencies.Scraping, scraper.KindEpisode, true))

	return app
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
	if err != nil || page < 1 {
		return 0, fiber.NewError(fiber.StatusBadRequest, "page must be a positive integer")
	}
	return page, nil
}

func respondWithScraping(c fiber.Ctx, service ScrapingService, request scraper.Request) error {
	if service == nil {
		return fiber.NewError(fiber.StatusServiceUnavailable, "scraping service is unavailable")
	}
	response, err := service.Get(c.Context(), request)
	if err != nil {
		return mapScrapingError(err)
	}
	return c.JSON(response)
}

func mapScrapingError(err error) error {
	switch {
	case errors.Is(err, scraper.ErrInvalidRequest):
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	case errors.Is(err, scraper.ErrNotFound):
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	case errors.Is(err, context.DeadlineExceeded):
		return fiber.NewError(fiber.StatusGatewayTimeout, "website sumber melewati batas waktu")
	case errors.Is(err, scraper.ErrUpstream), errors.Is(err, scraper.ErrInvalidContent):
		return fiber.NewError(fiber.StatusBadGateway, err.Error())
	default:
		return fiber.NewError(fiber.StatusInternalServerError, "internal server error")
	}
}
