package database

import (
	"context"
	"fmt"
	"time"

	"github.com/mevander88/belajar-scraping/backend/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Open(databaseURL string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("open PostgreSQL connection: %w", err)
	}
	if err := Ping(db); err != nil {
		return nil, err
	}
	return db, nil
}

func Ping(db *gorm.DB) error {
	if db == nil {
		return fmt.Errorf("PostgreSQL connection is not configured")
	}
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("get PostgreSQL connection: %w", err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := sqlDB.PingContext(ctx); err != nil {
		return fmt.Errorf("ping PostgreSQL: %w", err)
	}
	return nil
}

func Close(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("get PostgreSQL connection: %w", err)
	}
	if err := sqlDB.Close(); err != nil {
		return fmt.Errorf("close PostgreSQL connection: %w", err)
	}
	return nil
}

// Migrate is the single entry point for application schema migrations.
func Migrate(db *gorm.DB) error {
	if db == nil {
		return fmt.Errorf("cannot migrate without a database connection")
	}

	if err := db.AutoMigrate(&model.DataAnime{}); err != nil {
		return fmt.Errorf("migrate database schema: %w", err)
	}

	return nil
}
