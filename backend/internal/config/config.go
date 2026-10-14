package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	DatabaseURL    string
	AllowedOrigins []string
}

func Load() Config {
	_ = godotenv.Load()

	return Config{
		Port:           valueOrDefault("PORT", "8080"),
		DatabaseURL:    valueOrDefault("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/belajar_scraping?sslmode=disable"),
		AllowedOrigins: splitAndTrim(valueOrDefault("CORS_ALLOWED_ORIGINS", "http://localhost:3000")),
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
