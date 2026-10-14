import { ApiError, getStream } from "@/lib/api";
import { MAX_REDIRECTS, isAllowedMediaType, isAllowedMediaURL, isValidRange } from "@/lib/media-policy.mjs";
import type { MediaStream } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPEN_TIMEOUT_MS = 20_000;
type Params = { params: Promise<{ slug: string; server: string }> };

function errorResponse(message: string, status: number) {
  return Response.json({ status: "error", message }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function validateResolvedStream(stream: MediaStream) {
  return stream.kind === "file" && isAllowedMediaType(stream.content_type) && isAllowedMediaURL(stream.url);
}

async function fetchAllowedMedia(rawURL: string, method: "GET" | "HEAD", range: string | null, signal: AbortSignal) {
  let target = rawURL;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    if (!isAllowedMediaURL(target)) throw new Error("Sumber video tidak diizinkan.");
    const headers = new Headers({ Accept: "video/mp4,video/webm;q=0.9,*/*;q=0.1" });
    if (range) headers.set("Range", range);
    const response = await fetch(target, { method, headers, signal, redirect: "manual", cache: "no-store" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    await response.body?.cancel();
    if (!location || redirectCount === MAX_REDIRECTS) throw new Error("Redirect sumber video tidak valid.");
    target = new URL(location, target).toString();
  }
  throw new Error("Redirect sumber video terlalu banyak.");
}

async function openMedia(rawURL: string, method: "GET" | "HEAD", range: string | null, requestSignal: AbortSignal) {
  const controller = new AbortController();
  const abortUpstream = () => controller.abort(requestSignal.reason);
  if (requestSignal.aborted) abortUpstream();
  else requestSignal.addEventListener("abort", abortUpstream, { once: true });
  const timeout = setTimeout(
    () => controller.abort(new DOMException("Sumber video melewati batas waktu.", "TimeoutError")),
    OPEN_TIMEOUT_MS,
  );

  try {
    const response = await fetchAllowedMedia(rawURL, method, range, controller.signal);
    return { response, controller };
  } catch (error) {
    controller.abort(error);
    throw error;
  } finally {
    clearTimeout(timeout);
    requestSignal.removeEventListener("abort", abortUpstream);
  }
}

function responseHeaders(upstream: Response) {
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  });
  for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

function streamingBody(body: ReadableStream<Uint8Array>, upstreamController: AbortController, requestSignal: AbortSignal) {
  const reader = body.getReader();
  const abortUpstream = () => upstreamController.abort(requestSignal.reason);
  const cleanup = () => requestSignal.removeEventListener("abort", abortUpstream);
  requestSignal.addEventListener("abort", abortUpstream, { once: true });

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = await reader.read();
        if (chunk.done) {
          cleanup();
          controller.close();
          return;
        }
        controller.enqueue(chunk.value);
      } catch (error) {
        cleanup();
        controller.error(error);
      }
    },
    async cancel(reason) {
      cleanup();
      upstreamController.abort(reason);
      await reader.cancel(reason);
    },
  });
}

async function proxyMedia(request: Request, context: Params, method: "GET" | "HEAD") {
  const { slug, server } = await context.params;
  const range = request.headers.get("range");
  if (!isValidRange(range)) return errorResponse("Rentang video tidak valid.", 400);

  try {
    let stream = await getStream(slug, server, false, request.signal);
    if (!validateResolvedStream(stream)) return errorResponse("Format video belum didukung.", 422);

    let opened = await openMedia(stream.url, method, range, request.signal);
    let upstream = opened.response;
    if ([401, 403, 404, 410].includes(upstream.status)) {
      await upstream.body?.cancel();
      stream = await getStream(slug, server, true, request.signal);
      if (!validateResolvedStream(stream)) return errorResponse("Format video belum didukung.", 422);
      opened = await openMedia(stream.url, method, range, request.signal);
      upstream = opened.response;
    }

    const headers = responseHeaders(upstream);
    if (upstream.status === 416) {
      await upstream.body?.cancel();
      return new Response(null, { status: 416, headers });
    }
    if (upstream.status !== 200 && upstream.status !== 206) {
      await upstream.body?.cancel();
      return errorResponse("Sumber video tidak dapat diakses.", 502);
    }

    const contentType = (upstream.headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase();
    if (!isAllowedMediaType(contentType)) {
      await upstream.body?.cancel();
      return errorResponse("Respons sumber bukan file video yang didukung.", 502);
    }
    if (method === "HEAD" || !upstream.body) return new Response(null, { status: upstream.status, headers });
    return new Response(streamingBody(upstream.body, opened.controller, request.signal), { status: upstream.status, headers });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = [400, 404, 422].includes(error.status) ? error.status : 502;
      return errorResponse(error.message, status);
    }
    if (error instanceof DOMException && error.name === "TimeoutError") return errorResponse("Sumber video melewati batas waktu.", 504);
    return errorResponse("Video belum dapat dimuat.", 502);
  }
}

export async function GET(request: Request, context: Params) {
  return proxyMedia(request, context, "GET");
}

export async function HEAD(request: Request, context: Params) {
  return proxyMedia(request, context, "HEAD");
}
