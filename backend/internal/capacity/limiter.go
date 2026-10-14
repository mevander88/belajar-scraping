package capacity

import (
	"context"
	"errors"
)

var ErrOverloaded = errors.New("service capacity is full")

type Limiter struct {
	slots  chan struct{}
	queued chan struct{}
}

func New(maxActive, maxQueued int) *Limiter {
	if maxActive < 1 {
		maxActive = 1
	}
	if maxQueued < 0 {
		maxQueued = 0
	}
	return &Limiter{slots: make(chan struct{}, maxActive), queued: make(chan struct{}, maxQueued)}
}

func (l *Limiter) Acquire(ctx context.Context) (func(), error) {
	if l == nil {
		return func() {}, nil
	}
	select {
	case l.slots <- struct{}{}:
		return func() { <-l.slots }, nil
	default:
	}
	select {
	case l.queued <- struct{}{}:
		defer func() { <-l.queued }()
	default:
		return nil, ErrOverloaded
	}
	select {
	case l.slots <- struct{}{}:
		return func() { <-l.slots }, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}
