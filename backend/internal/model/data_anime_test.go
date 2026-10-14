package model

import (
	"sync"
	"testing"

	"gorm.io/gorm/schema"
)

func TestDataAnimeSchema(t *testing.T) {
	parsed, err := schema.Parse(&DataAnime{}, &sync.Map{}, schema.NamingStrategy{})
	if err != nil {
		t.Fatalf("parse DataAnime schema: %v", err)
	}

	if parsed.Table != "data_anime" {
		t.Fatalf("expected table data_anime, got %s", parsed.Table)
	}

	expectedTypes := map[string]string{
		"title": "varchar(255)", "title_japan": "varchar(255)", "skor": "varchar(10)",
		"produesur": "varchar(100)", "tipe": "varchar(100)", "status": "varchar(10)",
		"total_episode": "varchar(100)", "duration": "varchar(100)",
		"studion": "varchar(100)", "genre": "varchar(255)",
	}
	for column, dataType := range expectedTypes {
		field := parsed.LookUpField(column)
		if field == nil {
			t.Fatalf("expected column %s", column)
		}
		if string(field.DataType) != dataType {
			t.Errorf("expected %s type %s, got %s", column, dataType, field.DataType)
		}
	}

	if parsed.LookUpField("deleted_at") == nil {
		t.Fatal("expected deleted_at column for soft delete")
	}
	if len(parsed.ParseIndexes()) == 0 {
		t.Fatal("expected an index for deleted_at")
	}
	if _, ok := parsed.ParseCheckConstraints()["chk_data_anime_status"]; !ok {
		t.Fatal("expected status check constraint")
	}
}
