package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/mevander88/belajar-scraping/backend/internal/scraper"
)

type fakeScrapingService struct {
	request scraper.Request
	err     error
}

func (f *fakeScrapingService) Get(_ context.Context, request scraper.Request) (scraper.Response, error) {
	f.request = request
	if f.err != nil {
		return scraper.Response{}, f.err
	}
	return scraper.Response{
		Meta: scraper.Meta{Kind: request.Kind, SourceURL: "https://otakudesu.blog/", Count: 1, Cache: "miss"},
		Data: scraper.HomeData{Ongoing: []scraper.AnimeCard{{Slug: "example", Title: "Example"}}},
	}, nil
}

func TestCompleteCollectionMapsRequest(t *testing.T) {
	scrapingService := &fakeScrapingService{}
	app := NewWithDependencies(Dependencies{Scraping: scrapingService})
	response, err := app.Test(newRequest("/api/v1/source/anime?status=complete&page=2"))
	if err != nil {
		t.Fatalf("request complete collection: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, response.StatusCode)
	}
	if scrapingService.request.Kind != scraper.KindComplete || scrapingService.request.Page != 2 {
		t.Fatalf("unexpected scraper request: %#v", scrapingService.request)
	}
}

func TestScrapingErrorsUseSafePublicMessages(t *testing.T) {
	tests := []struct {
		name       string
		err        error
		statusCode int
		message    string
	}{
		{name: "timeout", err: fmt.Errorf("request failed: %w", context.DeadlineExceeded), statusCode: http.StatusGatewayTimeout, message: "website sumber melewati batas waktu"},
		{name: "upstream", err: fmt.Errorf("%w: private upstream detail", scraper.ErrUpstream), statusCode: http.StatusBadGateway, message: "website sumber tidak dapat diakses"},
		{name: "invalid content", err: fmt.Errorf("%w: selector detail", scraper.ErrInvalidContent), statusCode: http.StatusBadGateway, message: "struktur website sumber tidak dapat diproses"},
		{name: "not found", err: fmt.Errorf("%w: source URL", scraper.ErrNotFound), statusCode: http.StatusNotFound, message: "konten tidak ditemukan pada website sumber"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			app := NewWithDependencies(Dependencies{Scraping: &fakeScrapingService{err: test.err}})
			response, err := app.Test(newRequest("/api/v1/source/anime?status=complete"))
			if err != nil {
				t.Fatalf("request complete collection: %v", err)
			}
			defer response.Body.Close()
			if response.StatusCode != test.statusCode {
				t.Fatalf("expected status %d, got %d", test.statusCode, response.StatusCode)
			}
			var payload struct {
				Message string `json:"message"`
			}
			if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
				t.Fatalf("decode error response: %v", err)
			}
			if payload.Message != test.message {
				t.Fatalf("expected safe message %q, got %q", test.message, payload.Message)
			}
		})
	}
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

func TestAnimeEndpointDecodesUnicodeSlug(t *testing.T) {
	scrapingService := &fakeScrapingService{}
	app := NewWithDependencies(Dependencies{Scraping: scrapingService})
	response, err := app.Test(newRequest("/api/v1/source/anime/bang-dream-yume%E2%88%9Emita-sub-indo"))
	if err != nil {
		t.Fatalf("request anime endpoint: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, response.StatusCode)
	}
	if scrapingService.request.Slug != "bang-dream-yume∞mita-sub-indo" {
		t.Fatalf("expected canonical Unicode slug, got %q", scrapingService.request.Slug)
	}
}

func newRequest(path string) *http.Request {
	request, _ := http.NewRequest(http.MethodGet, path, nil)
	return request
}
