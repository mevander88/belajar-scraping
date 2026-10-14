package database

import (
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/mevander88/belajar-scraping/backend/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestMigrateDataAnimeOnPostgres(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set TEST_DATABASE_URL to run the PostgreSQL migration test")
	}

	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		t.Fatalf("connect to test database: %v", err)
	}

	schemaName := fmt.Sprintf("test_data_anime_%d", time.Now().UnixNano())
	if err := db.Exec(fmt.Sprintf(`CREATE SCHEMA %q`, schemaName)).Error; err != nil {
		t.Fatalf("create temporary schema: %v", err)
	}
	t.Cleanup(func() {
		if err := db.Exec(fmt.Sprintf(`DROP SCHEMA IF EXISTS %q CASCADE`, schemaName)).Error; err != nil {
			t.Errorf("drop temporary schema: %v", err)
		}
	})

	err = db.Connection(func(connection *gorm.DB) error {
		if err := connection.Exec(fmt.Sprintf(`SET search_path TO %q`, schemaName)).Error; err != nil {
			return fmt.Errorf("set search path: %w", err)
		}

		return connection.Transaction(func(tx *gorm.DB) error {
			if err := Migrate(tx); err != nil {
				return err
			}
			if !tx.Migrator().HasTable(&model.DataAnime{}) {
				return fmt.Errorf("data_anime table was not created")
			}

			if err := tx.SavePoint("before_invalid_status").Error; err != nil {
				return fmt.Errorf("create status test savepoint: %w", err)
			}
			invalid := model.DataAnime{Status: model.AnimeStatus("invalid")}
			if err := tx.Create(&invalid).Error; err == nil {
				return fmt.Errorf("status constraint accepted an invalid value")
			}
			if err := tx.RollbackTo("before_invalid_status").Error; err != nil {
				return fmt.Errorf("rollback invalid status test: %w", err)
			}

			anime := model.DataAnime{
				Title:       "Migration Test",
				Status:      model.AnimeStatusOngoing,
				ReleaseDate: time.Date(2026, time.January, 1, 0, 0, 0, 0, time.UTC),
			}
			if err := tx.Create(&anime).Error; err != nil {
				return fmt.Errorf("create valid anime: %w", err)
			}
			if anime.ID == 0 || anime.CreatedAt.IsZero() {
				return fmt.Errorf("automatic id or created_at was not populated")
			}

			previousUpdatedAt := anime.UpdatedAt
			time.Sleep(10 * time.Millisecond)
			if err := tx.Model(&anime).Update("title", "Migration Test Updated").Error; err != nil {
				return fmt.Errorf("update anime: %w", err)
			}
			if !anime.UpdatedAt.After(previousUpdatedAt) {
				return fmt.Errorf("updated_at was not advanced")
			}

			if err := tx.Delete(&anime).Error; err != nil {
				return fmt.Errorf("soft delete anime: %w", err)
			}
			if anime.DeletedAt.Time.IsZero() {
				return fmt.Errorf("deleted_at was not populated")
			}

			return nil
		})
	})
	if err != nil {
		t.Fatal(err)
	}
}
