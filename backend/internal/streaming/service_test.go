package streaming

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/mevander88/belajar-scraping/backend/internal/scraper"
)

type fakeSource struct {
	calls  int
	stream scraper.MediaStream
}

func (f *fakeSource) ResolveStream(_ context.Context, _, _ string) (scraper.MediaStream, error) {
	f.calls++
	return f.stream, nil
}

type fakeCache struct {
	payload []byte
	sets    int
}

func (f *fakeCache) Get(context.Context, string, bool) ([]byte, bool, error) {
	return f.payload, len(f.payload) > 0, nil
}

func (f *fakeCache) Set(context.Context, string, []byte, time.Duration, time.Duration) error {
	f.sets++
	return nil
}

func TestResolveStreamUsesCachedResolution(t *testing.T) {
	cached := scraper.MediaStream{ServerID: "480p-0", URL: "https://cdn.odcloud.net/cached.mp4", Kind: "file", ContentType: "video/mp4"}
	payload, err := json.Marshal(cached)
	if err != nil {
		t.Fatal(err)
	}
	source := &fakeSource{stream: scraper.MediaStream{URL: "https://cdn.odcloud.net/fresh.mp4"}}
	service := New(source, &fakeCache{payload: payload}, time.Minute)

	stream, err := service.ResolveStream(context.Background(), "episode-1", "480p-0", false)
	if err != nil {
		t.Fatal(err)
	}
	if stream.URL != cached.URL || source.calls != 0 {
		t.Fatalf("expected cached stream without source call, got url=%q calls=%d", stream.URL, source.calls)
	}
}

func TestResolveStreamRefreshBypassesCache(t *testing.T) {
	cached, err := json.Marshal(scraper.MediaStream{URL: "https://cdn.odcloud.net/expired.mp4"})
	if err != nil {
		t.Fatal(err)
	}
	fresh := scraper.MediaStream{ServerID: "480p-0", URL: "https://cdn.odcloud.net/fresh.mp4", Kind: "file", ContentType: "video/mp4"}
	source := &fakeSource{stream: fresh}
	cache := &fakeCache{payload: cached}
	service := New(source, cache, time.Minute)

	stream, err := service.ResolveStream(context.Background(), "episode-1", "480p-0", true)
	if err != nil {
		t.Fatal(err)
	}
	if stream.URL != fresh.URL || source.calls != 1 || cache.sets != 1 {
		t.Fatalf("expected refreshed and cached stream, got url=%q calls=%d sets=%d", stream.URL, source.calls, cache.sets)
	}
}
