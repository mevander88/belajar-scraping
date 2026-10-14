package cache

import (
	"context"
	"testing"
	"time"
)

func TestMemoryStoreRetainsStaleValueAfterFreshExpiry(t *testing.T) {
	store := NewMemory(1024)
	if err := store.Set(context.Background(), "key", []byte("value"), time.Millisecond, time.Minute); err != nil {
		t.Fatal(err)
	}
	time.Sleep(5 * time.Millisecond)
	if _, found, _ := store.Get(context.Background(), "key", false); found {
		t.Fatal("fresh value should expire")
	}
	value, found, err := store.Get(context.Background(), "key", true)
	if err != nil || !found || string(value) != "value" {
		t.Fatalf("expected stale value, found=%v err=%v", found, err)
	}
}

func TestMemoryStoreEvictsWithinByteBudget(t *testing.T) {
	store := NewMemory(5)
	_ = store.Set(context.Background(), "first", []byte("1234"), time.Minute, 0)
	_ = store.Set(context.Background(), "second", []byte("5678"), time.Minute, 0)
	if _, found, _ := store.Get(context.Background(), "first", false); found {
		t.Fatal("oldest value should be evicted")
	}
	if _, found, _ := store.Get(context.Background(), "second", false); !found {
		t.Fatal("newest value should remain")
	}
}

func TestTieredStoreSkipsUnavailablePrimaryAtStartup(t *testing.T) {
	local := NewMemory(1024)
	_ = local.Set(context.Background(), "key", []byte("fallback"), time.Minute, 0)
	store := NewTiered(&Store{}, local, false)
	if store.allowPrimary() {
		t.Fatal("unavailable primary should not be retried immediately")
	}
	value, found, err := store.Get(context.Background(), "key", false)
	if err != nil || !found || string(value) != "fallback" {
		t.Fatalf("expected local fallback, found=%v err=%v", found, err)
	}
}
