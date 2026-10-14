package coalesce

import (
	"context"
	"sync"
)

// Group shares one in-flight result between callers using the same key.
// Completed results are not retained; durable caching remains the caller's job.
type Group[K comparable, V any] struct {
	mu    sync.Mutex
	calls map[K]*call[V]
}

type call[V any] struct {
	done  chan struct{}
	value V
	err   error
}

func (g *Group[K, V]) Do(ctx context.Context, key K, work func() (V, error)) (V, error) {
	g.mu.Lock()
	if g.calls == nil {
		g.calls = make(map[K]*call[V])
	}
	if existing, ok := g.calls[key]; ok {
		g.mu.Unlock()
		select {
		case <-ctx.Done():
			var zero V
			return zero, ctx.Err()
		case <-existing.done:
			return existing.value, existing.err
		}
	}

	current := &call[V]{done: make(chan struct{})}
	g.calls[key] = current
	g.mu.Unlock()

	current.value, current.err = work()

	g.mu.Lock()
	delete(g.calls, key)
	close(current.done)
	g.mu.Unlock()

	return current.value, current.err
}
