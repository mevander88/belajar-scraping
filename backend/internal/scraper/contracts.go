package scraper

import "time"

type ContentKind string

const (
	KindHome     ContentKind = "home"
	KindCatalog  ContentKind = "catalog"
	KindSchedule ContentKind = "schedule"
	KindGenres   ContentKind = "genres"
	KindOngoing  ContentKind = "ongoing"
	KindComplete ContentKind = "complete"
	KindGenre    ContentKind = "genre"
	KindAnime    ContentKind = "anime"
	KindEpisode  ContentKind = "episode"
	KindSearch   ContentKind = "search"
)

type Request struct {
	Kind  ContentKind `json:"kind"`
	Slug  string      `json:"slug,omitempty"`
	Query string      `json:"query,omitempty"`
	Page  int         `json:"page,omitempty"`
}

type Meta struct {
	Kind      ContentKind `json:"kind"`
	SourceURL string      `json:"source_url"`
	FetchedAt time.Time   `json:"fetched_at"`
	Count     int         `json:"count"`
	Cache     string      `json:"cache"`
	Warnings  []string    `json:"warnings,omitempty"`
}

type Response struct {
	Meta Meta `json:"meta"`
	Data any  `json:"data"`
}

type AnimeCard struct {
	Slug         string  `json:"slug"`
	Title        string  `json:"title"`
	URL          string  `json:"url"`
	CoverURL     string  `json:"cover_url,omitempty"`
	EpisodeText  string  `json:"episode_text,omitempty"`
	ScheduleText string  `json:"schedule_text,omitempty"`
	UpdatedText  string  `json:"updated_text,omitempty"`
	Score        string  `json:"score,omitempty"`
	Status       string  `json:"status,omitempty"`
	Studio       string  `json:"studio,omitempty"`
	ReleaseText  string  `json:"release_text,omitempty"`
	Synopsis     string  `json:"synopsis,omitempty"`
	Genres       []Genre `json:"genres,omitempty"`
}

type HomeData struct {
	Ongoing  []AnimeCard `json:"ongoing"`
	Complete []AnimeCard `json:"complete"`
}

type CatalogItem struct {
	Slug   string `json:"slug"`
	Title  string `json:"title"`
	URL    string `json:"url"`
	Status string `json:"status,omitempty"`
}

type Pagination struct {
	Current  int    `json:"current"`
	Last     int    `json:"last"`
	Previous string `json:"previous_url,omitempty"`
	Next     string `json:"next_url,omitempty"`
}

type AnimeCollection struct {
	Items      []AnimeCard `json:"items"`
	Pagination Pagination  `json:"pagination"`
}

type SearchData struct {
	Query      string      `json:"query"`
	MaxResults int         `json:"max_results"`
	Items      []AnimeCard `json:"items"`
}

type Genre struct {
	Slug string `json:"slug"`
	Name string `json:"name"`
	URL  string `json:"url"`
}

type ScheduleGroup struct {
	Day   string        `json:"day"`
	Items []CatalogItem `json:"items"`
}

type EpisodeSummary struct {
	Slug        string `json:"slug"`
	Title       string `json:"title"`
	URL         string `json:"url"`
	ReleaseText string `json:"release_text,omitempty"`
}

type AnimeDetail struct {
	Slug           string           `json:"slug"`
	URL            string           `json:"url"`
	Title          string           `json:"title"`
	TitleJapan     string           `json:"title_japan,omitempty"`
	CoverURL       string           `json:"cover_url,omitempty"`
	Score          string           `json:"score,omitempty"`
	Producer       string           `json:"producer,omitempty"`
	Type           string           `json:"type,omitempty"`
	Status         string           `json:"status,omitempty"`
	TotalEpisodes  string           `json:"total_episodes,omitempty"`
	Duration       string           `json:"duration,omitempty"`
	ReleaseDate    string           `json:"release_date,omitempty"`
	ReleaseDateRaw string           `json:"release_date_raw,omitempty"`
	Studio         string           `json:"studio,omitempty"`
	Genres         []Genre          `json:"genres"`
	Synopsis       string           `json:"synopsis,omitempty"`
	Episodes       []EpisodeSummary `json:"episodes"`
	Batches        []EpisodeSummary `json:"batches"`
}

type StreamServer struct {
	ID        string `json:"id"`
	Provider  string `json:"provider"`
	Quality   string `json:"quality"`
	Default   bool   `json:"default,omitempty"`
	Supported bool   `json:"supported"`
}

type MediaStream struct {
	ServerID    string `json:"server_id"`
	Provider    string `json:"provider"`
	Quality     string `json:"quality"`
	URL         string `json:"url"`
	Kind        string `json:"kind"`
	ContentType string `json:"content_type"`
}

type DownloadLink struct {
	Provider string `json:"provider"`
	URL      string `json:"url"`
}

type DownloadGroup struct {
	Label string         `json:"label"`
	Size  string         `json:"size,omitempty"`
	Links []DownloadLink `json:"links"`
}

type EpisodeDetail struct {
	Slug      string           `json:"slug"`
	URL       string           `json:"url"`
	Title     string           `json:"title"`
	PosterURL string           `json:"poster_url,omitempty"`
	Servers   []StreamServer   `json:"servers"`
	Episodes  []EpisodeSummary `json:"episode_options"`
	Downloads []DownloadGroup  `json:"downloads"`
}
