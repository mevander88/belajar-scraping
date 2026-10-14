package scraping

import (
	"context"
	"encoding/json"
	"errors"
	"testing"
	"time"

	"github.com/mevander88/belajar-scraping/backend/internal/scraper"
)

type fakeSource struct {
	response scraper.Response
	err      error
	calls    int
}

func (f *fakeSource) Run(context.Context, scraper.Request) (scraper.Response, error) {
	f.calls++
	return f.response, f.err
}

type fakeCache struct {
	fresh    []byte
	stale    []byte
	getErr   error
	setErr   error
	setCalls int
	freshTTL time.Duration
	staleTTL time.Duration
}

func (f *fakeCache) Get(_ context.Context, _ string, stale bool) ([]byte, bool, error) {
	if f.getErr != nil {
		return nil, false, f.getErr
	}
	value := f.fresh
	if stale {
		value = f.stale
	}
	return value, len(value) > 0, nil
}

func (f *fakeCache) Set(_ context.Context, _ string, _ []byte, freshTTL, staleTTL time.Duration) error {
	f.setCalls++
	f.freshTTL = freshTTL
	f.staleTTL = staleTTL
	return f.setErr
}

func TestServiceReturnsFreshCacheWithoutCallingSource(t *testing.T) {
	cached := sampleResponse()
	payload, _ := json.Marshal(cached)
	source := &fakeSource{}
	service := New(source, &fakeCache{fresh: payload}, Policy{})

	response, err := service.Get(context.Background(), scraper.Request{Kind: scraper.KindHome, Page: 1})
	if err != nil {
		t.Fatal(err)
	}
	if source.calls != 0 {
		t.Fatalf("expected source not to be called, got %d calls", source.calls)
	}
	if response.Meta.Cache != "hit" {
		t.Fatalf("expected cache hit, got %q", response.Meta.Cache)
	}
}

func TestServiceScrapesAndCachesMiss(t *testing.T) {
	source := &fakeSource{response: sampleResponse()}
	cache := &fakeCache{}
	service := New(source, cache, Policy{
		TTL:      map[scraper.ContentKind]time.Duration{scraper.KindHome: 5 * time.Minute},
		StaleTTL: 24 * time.Hour,
	})

	response, err := service.Get(context.Background(), scraper.Request{Kind: scraper.KindHome, Page: 1})
	if err != nil {
		t.Fatal(err)
	}
	if response.Meta.Cache != "miss" || source.calls != 1 || cache.setCalls != 1 {
		t.Fatalf("unexpected miss result: response=%#v source_calls=%d set_calls=%d", response.Meta, source.calls, cache.setCalls)
	}
	if cache.freshTTL != 5*time.Minute || cache.staleTTL != 24*time.Hour {
		t.Fatalf("unexpected cache policy: fresh=%s stale=%s", cache.freshTTL, cache.staleTTL)
	}
}

func TestServiceUsesStaleCacheWhenSourceFails(t *testing.T) {
	payload, _ := json.Marshal(sampleResponse())
	source := &fakeSource{err: scraper.ErrUpstream}
	service := New(source, &fakeCache{stale: payload}, Policy{})

	response, err := service.Get(context.Background(), scraper.Request{Kind: scraper.KindHome, Page: 1})
	if err != nil {
		t.Fatal(err)
	}
	if response.Meta.Cache != "stale" || len(response.Meta.Warnings) == 0 {
		t.Fatalf("expected stale response with warning, got %#v", response.Meta)
	}
}

func TestServiceUsesStaleCompleteCollectionWhenSourceTimesOut(t *testing.T) {
	cached := scraper.Response{
		Meta: scraper.Meta{Kind: scraper.KindComplete, SourceURL: "https://otakudesu.blog/complete-anime/", Count: 1},
		Data: scraper.AnimeCollection{
			Items:      []scraper.AnimeCard{{Slug: "finished", Title: "Finished", Status: "complete"}},
			Pagination: scraper.Pagination{Current: 1, Last: 1},
		},
	}
	payload, _ := json.Marshal(cached)
	source := &fakeSource{err: context.DeadlineExceeded}
	service := New(source, &fakeCache{stale: payload}, Policy{})

	response, err := service.Get(context.Background(), scraper.Request{Kind: scraper.KindComplete, Page: 1})
	if err != nil {
		t.Fatal(err)
	}
	if response.Meta.Kind != scraper.KindComplete || response.Meta.Cache != "stale" || response.Meta.Count != 1 {
		t.Fatalf("expected stale complete collection, got %#v", response.Meta)
	}
}

func TestServiceBypassesUnavailableCache(t *testing.T) {
	source := &fakeSource{response: sampleResponse()}
	cache := &fakeCache{getErr: errors.New("Redis unavailable")}
	service := New(source, cache, Policy{})

	response, err := service.Get(context.Background(), scraper.Request{Kind: scraper.KindHome, Page: 1})
	if err != nil {
		t.Fatal(err)
	}
	if response.Meta.Cache != "bypass" || cache.setCalls != 0 {
		t.Fatalf("expected cache bypass, got %#v", response.Meta)
	}
}

func TestServiceReturnsSourceFailureWhenCacheIsUnavailable(t *testing.T) {
	source := &fakeSource{err: scraper.ErrUpstream}
	cache := &fakeCache{getErr: errors.New("Redis unavailable")}
	service := New(source, cache, Policy{})

	_, err := service.Get(context.Background(), scraper.Request{Kind: scraper.KindComplete, Page: 1})
	if !errors.Is(err, scraper.ErrUpstream) {
		t.Fatalf("expected source failure, got %v", err)
	}
}

func TestServiceUsesLongerTTLForCompleteAnime(t *testing.T) {
	response := scraper.Response{
		Meta: scraper.Meta{Kind: scraper.KindAnime, SourceURL: "https://otakudesu.blog/anime/example/", Count: 1},
		Data: scraper.AnimeDetail{Slug: "example", Title: "Example", Status: "complete"},
	}
	cache := &fakeCache{}
	service := New(&fakeSource{response: response}, cache, Policy{
		TTL:              map[scraper.ContentKind]time.Duration{scraper.KindAnime: time.Hour},
		CompleteAnimeTTL: 12 * time.Hour,
		StaleTTL:         24 * time.Hour,
	})

	_, err := service.Get(context.Background(), scraper.Request{Kind: scraper.KindAnime, Slug: "example", Page: 1})
	if err != nil {
		t.Fatal(err)
	}
	if cache.freshTTL != 12*time.Hour {
		t.Fatalf("expected complete anime TTL, got %s", cache.freshTTL)
	}
}

func TestSearchCacheKeyUsesNormalizedQuery(t *testing.T) {
	first := cacheKey(scraper.Request{Kind: scraper.KindSearch, Query: "  one   piece ", Page: 1})
	second := cacheKey(scraper.Request{Kind: scraper.KindSearch, Query: "one piece", Page: 1})
	other := cacheKey(scraper.Request{Kind: scraper.KindSearch, Query: "naruto", Page: 1})
	if first != second {
		t.Fatalf("expected equivalent queries to share a cache key: %q != %q", first, second)
	}
	if first == other {
		t.Fatalf("expected different queries to use different cache keys: %q", first)
	}
}

func sampleResponse() scraper.Response {
	return scraper.Response{
		Meta: scraper.Meta{
			Kind: scraper.KindHome, SourceURL: "https://otakudesu.blog/", FetchedAt: time.Now(), Count: 1,
		},
		Data: scraper.HomeData{Ongoing: []scraper.AnimeCard{{Slug: "example", Title: "Example"}}},
	}
}
