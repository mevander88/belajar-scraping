package server

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/mevander88/belajar-scraping/backend/internal/scraper"
)

type fakeScrapingService struct {
	request scraper.Request
}

func (f *fakeScrapingService) Get(_ context.Context, request scraper.Request) (scraper.Response, error) {
	f.request = request
	return scraper.Response{
		Meta: scraper.Meta{Kind: request.Kind, SourceURL: "https://otakudesu.blog/", Count: 1, Cache: "miss"},
		Data: scraper.HomeData{Ongoing: []scraper.AnimeCard{{Slug: "example", Title: "Example"}}},
	}, nil
}

func TestHealthEndpoint(t *testing.T) {
	app := New(nil, []string{"http://localhost:3000"})
	response, err := app.Test(newRequest("/api/v1/health"))
	if err != nil {
		t.Fatalf("request health endpoint: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, response.StatusCode)
	}
}

func TestReadinessEndpointReportsMissingDatabase(t *testing.T) {
	app := New(nil, []string{"http://localhost:3000"})
	response, err := app.Test(newRequest("/api/v1/ready"))
	if err != nil {
		t.Fatalf("request readiness endpoint: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusServiceUnavailable {
		t.Fatalf("expected status %d, got %d", http.StatusServiceUnavailable, response.StatusCode)
	}
}

func TestHomeScrapingEndpoint(t *testing.T) {
	scrapingService := &fakeScrapingService{}
	app := NewWithDependencies(Dependencies{
		Scraping: scrapingService, AllowedOrigins: []string{"http://localhost:3000"},
	})
	response, err := app.Test(newRequest("/api/v1/source/home"))
	if err != nil {
		t.Fatalf("request home scraping endpoint: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, response.StatusCode)
	}
	var payload scraper.Response
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if scrapingService.request.Kind != scraper.KindHome || scrapingService.request.Page != 1 {
		t.Fatalf("unexpected scraper request: %#v", scrapingService.request)
	}
}

func TestAnimeCollectionRequiresSupportedStatus(t *testing.T) {
	app := NewWithDependencies(Dependencies{Scraping: &fakeScrapingService{}})
	response, err := app.Test(newRequest("/api/v1/source/anime?status=unknown"))
	if err != nil {
		t.Fatalf("request anime collection endpoint: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, response.StatusCode)
	}
}

func TestGenreEndpointMapsSlugAndPage(t *testing.T) {
	scrapingService := &fakeScrapingService{}
	app := NewWithDependencies(Dependencies{Scraping: scrapingService})
	response, err := app.Test(newRequest("/api/v1/source/genres/action?page=2"))
	if err != nil {
		t.Fatalf("request genre endpoint: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, response.StatusCode)
	}
	if scrapingService.request.Kind != scraper.KindGenre || scrapingService.request.Slug != "action" || scrapingService.request.Page != 2 {
		t.Fatalf("unexpected scraper request: %#v", scrapingService.request)
	}
}

func newRequest(path string) *http.Request {
	request, _ := http.NewRequest(http.MethodGet, path, nil)
	return request
}
