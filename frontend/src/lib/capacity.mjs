export class CapacityError extends Error {}

export function createCapacityLimiter(maxActive, maxQueued) {
  let active = 0;
  const queue = [];
  const releaseOnce = () => {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = queue.shift();
      if (next) next(); else active -= 1;
    };
  };
  return {
    acquire(signal) {
      if (active < maxActive) {
        active += 1;
        return Promise.resolve(releaseOnce());
      }
      if (queue.length >= maxQueued) return Promise.reject(new CapacityError("capacity full"));
      return new Promise((resolve, reject) => {
        const start = () => { signal?.removeEventListener("abort", abort); resolve(releaseOnce()); };
        const abort = () => {
          const index = queue.indexOf(start);
          if (index >= 0) queue.splice(index, 1);
          reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
        };
        if (signal?.aborted) return abort();
        signal?.addEventListener("abort", abort, { once: true });
        queue.push(start);
      });
    },
  };
}

const positive = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const nonNegative = (value, fallback) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

export const streamCapacity = createCapacityLimiter(
  positive(process.env.STREAM_PROXY_MAX_CONNECTIONS, 100),
  nonNegative(process.env.STREAM_PROXY_MAX_QUEUE, 20),
);
