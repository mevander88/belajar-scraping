package streaming

import (
	"context"
	"encoding/json"
	"errors"
	"sync"
	"sync/atomic"
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
	service := New(source, &fakeCache{payload: payload}, time.Minute, time.Second)

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
	service := New(source, cache, time.Minute, time.Second)

	stream, err := service.ResolveStream(context.Background(), "episode-1", "480p-0", true)
	if err != nil {
		t.Fatal(err)
	}
	if stream.URL != fresh.URL || source.calls != 1 || cache.sets != 1 {
		t.Fatalf("expected refreshed and cached stream, got url=%q calls=%d sets=%d", stream.URL, source.calls, cache.sets)
	}
}

func TestResolveStreamUsesBoundedLocalCacheWithoutRedis(t *testing.T) {
	source := &fakeSource{stream: scraper.MediaStream{ServerID: "480p-0", URL: "https://cdn.odcloud.net/video.mp4"}}
	service := New(source, nil, time.Minute, time.Second)

	for range 2 {
		if _, err := service.ResolveStream(context.Background(), "episode-1", "480p-0", false); err != nil {
			t.Fatal(err)
		}
	}
	if source.calls != 1 {
		t.Fatalf("expected one source call, got %d", source.calls)
	}
}

type blockingSource struct {
	calls   atomic.Int32
	started chan struct{}
	release chan struct{}
}

func (s *blockingSource) ResolveStream(ctx context.Context, _, _ string) (scraper.MediaStream, error) {
	if s.calls.Add(1) == 1 {
		close(s.started)
	}
	select {
	case <-ctx.Done():
		return scraper.MediaStream{}, ctx.Err()
	case <-s.release:
		return scraper.MediaStream{ServerID: "480p-0", URL: "https://cdn.odcloud.net/video.mp4"}, nil
	}
}

func TestResolveStreamCoalescesConcurrentMisses(t *testing.T) {
	source := &blockingSource{started: make(chan struct{}), release: make(chan struct{})}
	service := New(source, nil, time.Minute, time.Second)
	const callers = 6
	errorsFound := make(chan error, callers)
	var ready sync.WaitGroup
	ready.Add(callers)
	start := make(chan struct{})
	for range callers {
		go func() {
			ready.Done()
			<-start
			_, err := service.ResolveStream(context.Background(), "episode-1", "480p-0", false)
			errorsFound <- err
		}()
	}
	ready.Wait()
	close(start)
	<-source.started
	time.Sleep(10 * time.Millisecond)
	close(source.release)
	for range callers {
		if err := <-errorsFound; err != nil {
			t.Fatal(err)
		}
	}
	if source.calls.Load() != 1 {
		t.Fatalf("expected one source call, got %d", source.calls.Load())
	}
}

func TestResolveStreamAppliesResolutionDeadline(t *testing.T) {
	source := &blockingSource{started: make(chan struct{}), release: make(chan struct{})}
	service := New(source, nil, time.Minute, 10*time.Millisecond)
	_, err := service.ResolveStream(context.Background(), "episode-1", "480p-0", false)
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Fatalf("expected deadline exceeded, got %v", err)
	}
}
