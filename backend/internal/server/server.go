package server

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/mevander88/belajar-scraping/backend/internal/database"
	"gorm.io/gorm"
)

type healthResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Database  string `json:"database,omitempty"`
	Timestamp string `json:"timestamp"`
}

func New(db *gorm.DB, allowedOrigins []string) *fiber.App {
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
	app.Use(cors.New(cors.Config{AllowOrigins: allowedOrigins}))

	api := app.Group("/api/v1")
	api.Get("/health", func(c fiber.Ctx) error {
		return c.JSON(healthResponse{
			Status: "ok", Service: "belajar-scraping-api",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
	})

	api.Get("/ready", func(c fiber.Ctx) error {
		if err := database.Ping(db); err != nil {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"status": "unavailable", "database": "disconnected", "message": err.Error(),
			})
		}
		return c.JSON(healthResponse{
			Status: "ready", Service: "belajar-scraping-api", Database: "connected",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
		})
	})

	return app
}
