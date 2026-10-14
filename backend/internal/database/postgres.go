package database

import (
	"context"
	"fmt"
	"time"

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

// Migrate is the single entry point for schema migrations. Add future GORM
// models here once the application has defined its business domain.
func Migrate(db *gorm.DB, models ...any) error {
	if len(models) == 0 {
		return nil
	}
	return db.AutoMigrate(models...)
}
