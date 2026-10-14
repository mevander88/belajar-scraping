package model

import (
	"time"

	"gorm.io/gorm"
)

type AnimeStatus string

const (
	AnimeStatusOngoing  AnimeStatus = "ongoing"
	AnimeStatusComplete AnimeStatus = "complete"
)

type DataAnime struct {
	ID           int            `gorm:"type:integer;primaryKey;autoIncrement"`
	Title        string         `gorm:"type:varchar(255)"`
	TitleJapan   string         `gorm:"type:varchar(255)"`
	CoverURL     string         `gorm:"type:text"`
	Skor         string         `gorm:"type:varchar(10)"`
	Produesur    string         `gorm:"type:varchar(100)"`
	Tipe         string         `gorm:"type:varchar(100)"`
	Status       AnimeStatus    `gorm:"type:varchar(10);not null;check:chk_data_anime_status,status IN ('ongoing','complete')"`
	TotalEpisode string         `gorm:"type:varchar(100)"`
	Duration     string         `gorm:"type:varchar(100)"`
	ReleaseDate  time.Time      `gorm:"type:date"`
	Studion      string         `gorm:"type:varchar(100)"`
	Genre        string         `gorm:"type:varchar(255)"`
	CreatedAt    time.Time      `gorm:"type:timestamp;not null;default:CURRENT_TIMESTAMP;autoCreateTime"`
	UpdatedAt    time.Time      `gorm:"type:timestamp;autoUpdateTime"`
	DeletedAt    gorm.DeletedAt `gorm:"type:timestamp;index"`
}

func (DataAnime) TableName() string {
	return "data_anime"
}
