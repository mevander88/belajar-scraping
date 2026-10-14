package main

import (
	"log"

	"github.com/mevander88/belajar-scraping/backend/internal/config"
	"github.com/mevander88/belajar-scraping/backend/internal/database"
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

	app := server.New(db, cfg.AllowedOrigins)
	address := ":" + cfg.Port
	log.Printf("API listening on http://localhost%s", address)

	if err := app.Listen(address); err != nil {
		log.Fatalf("API stopped: %v", err)
	}
}
