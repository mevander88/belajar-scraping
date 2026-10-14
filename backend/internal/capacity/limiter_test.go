package capacity

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestLimiterRejectsPastQueueCapacity(t *testing.T) {
	limiter := New(1, 0)
	release, err := limiter.Acquire(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer release()
	if _, err := limiter.Acquire(context.Background()); !errors.Is(err, ErrOverloaded) {
		t.Fatalf("expected overload, got %v", err)
	}
}

func TestLimiterQueuedRequestCanBeCancelled(t *testing.T) {
	limiter := New(1, 1)
	release, err := limiter.Acquire(context.Background())
	if err != nil {
		t.Fatal(err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := limiter.Acquire(ctx); !errors.Is(err, context.Canceled) {
		t.Fatalf("expected cancellation, got %v", err)
	}
	release()

	acquireContext, stop := context.WithTimeout(context.Background(), time.Second)
	defer stop()
	nextRelease, err := limiter.Acquire(acquireContext)
	if err != nil {
		t.Fatalf("cancelled waiter should release queue capacity: %v", err)
	}
	nextRelease()
}
