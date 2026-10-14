package coalesce

import (
	"context"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestGroupSharesInflightResult(t *testing.T) {
	var group Group[string, string]
	var calls atomic.Int32
	release := make(chan struct{})
	start := make(chan struct{})
	const callers = 8
	results := make(chan string, callers)
	var ready sync.WaitGroup
	ready.Add(callers)

	for range callers {
		go func() {
			ready.Done()
			<-start
			value, err := group.Do(context.Background(), "same", func() (string, error) {
				calls.Add(1)
				<-release
				return "shared", nil
			})
			if err != nil {
				results <- err.Error()
				return
			}
			results <- value
		}()
	}
	ready.Wait()
	close(start)
	time.Sleep(10 * time.Millisecond)
	close(release)

	for range callers {
		if result := <-results; result != "shared" {
			t.Fatalf("unexpected result %q", result)
		}
	}
	if calls.Load() != 1 {
		t.Fatalf("expected one call, got %d", calls.Load())
	}
}

func TestWaitingCallerCanCancel(t *testing.T) {
	var group Group[string, string]
	release := make(chan struct{})
	started := make(chan struct{})
	go func() {
		_, _ = group.Do(context.Background(), "same", func() (string, error) {
			close(started)
			<-release
			return "shared", nil
		})
	}()
	<-started

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := group.Do(ctx, "same", func() (string, error) { return "unexpected", nil }); err != context.Canceled {
		t.Fatalf("expected canceled waiter, got %v", err)
	}
	close(release)
}
