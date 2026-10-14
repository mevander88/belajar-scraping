import assert from "node:assert/strict";
import test from "node:test";
import { CapacityError, createCapacityLimiter } from "./capacity.mjs";

test("capacity limiter rejects beyond queue", async () => {
  const limiter = createCapacityLimiter(1, 1);
  const release = await limiter.acquire();
  const waiting = limiter.acquire();
  await assert.rejects(limiter.acquire(), CapacityError);
  release();
  const releaseWaiting = await waiting;
  releaseWaiting();
});

test("releasing the same slot twice does not increase capacity", async () => {
  const limiter = createCapacityLimiter(1, 0);
  const release = await limiter.acquire();
  release();
  release();

  const nextRelease = await limiter.acquire();
  await assert.rejects(limiter.acquire(), CapacityError);
  nextRelease();
});

test("cancelled waiter leaves the queue", async () => {
  const limiter = createCapacityLimiter(1, 1);
  const release = await limiter.acquire();
  const controller = new AbortController();
  const waiting = limiter.acquire(controller.signal);
  controller.abort();
  await assert.rejects(waiting, { name: "AbortError" });

  const next = limiter.acquire();
  release();
  const nextRelease = await next;
  nextRelease();
});
