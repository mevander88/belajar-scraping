package server

import (
	"net/http"
	"testing"
)

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

func newRequest(path string) *http.Request {
	request, _ := http.NewRequest(http.MethodGet, path, nil)
	return request
}
