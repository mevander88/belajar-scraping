import { ApiError, getStream } from "@/lib/api";
import type { MediaStream } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPEN_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 3;
const RANGE_PATTERN = /^bytes=(?:\d+-\d*|-\d+)$/;
const ALLOWED_MEDIA_TYPES = new Set(["video/mp4", "video/webm"]);

type Params = { params: Promise<{ slug: string; server: string }> };

function errorResponse(message: string, status: number) {
  return Response.json({ status: "error", message }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isAllowedMediaURL(rawURL: string) {
  try {
    const parsed = new URL(rawURL);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    return host === "cdn.odcloud.net" || host === "archive.org" || host.endsWith(".archive.org");
  } catch {
    return false;
  }
}

function validateResolvedStream(stream: MediaStream) {
  return stream.kind === "file" && ALLOWED_MEDIA_TYPES.has(stream.content_type.toLowerCase()) && isAllowedMediaURL(stream.url);
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
  if (range && !RANGE_PATTERN.test(range)) return errorResponse("Rentang video tidak valid.", 400);

  const upstreamController = new AbortController();
  const abortUpstream = () => upstreamController.abort(request.signal.reason);
  if (request.signal.aborted) abortUpstream();
  else request.signal.addEventListener("abort", abortUpstream, { once: true });
  const timeout = setTimeout(() => upstreamController.abort(new DOMException("Sumber video melewati batas waktu.", "TimeoutError")), OPEN_TIMEOUT_MS);

  try {
    let stream = await getStream(slug, server, false, request.signal);
    if (!validateResolvedStream(stream)) return errorResponse("Format video belum didukung.", 422);

    let upstream = await fetchAllowedMedia(stream.url, method, range, upstreamController.signal);
    if ([401, 403, 404, 410].includes(upstream.status)) {
      await upstream.body?.cancel();
      stream = await getStream(slug, server, true, request.signal);
      if (!validateResolvedStream(stream)) return errorResponse("Format video belum didukung.", 422);
      upstream = await fetchAllowedMedia(stream.url, method, range, upstreamController.signal);
    }
    clearTimeout(timeout);

    const headers = responseHeaders(upstream);
    if (upstream.status === 416) return new Response(null, { status: 416, headers });
    if (upstream.status !== 200 && upstream.status !== 206) {
      await upstream.body?.cancel();
      return errorResponse("Sumber video tidak dapat diakses.", 502);
    }

    const contentType = (upstream.headers.get("content-type") ?? "").split(";", 1)[0].trim().toLowerCase();
    if (!ALLOWED_MEDIA_TYPES.has(contentType)) {
      await upstream.body?.cancel();
      return errorResponse("Respons sumber bukan file video yang didukung.", 502);
    }
    if (method === "HEAD" || !upstream.body) return new Response(null, { status: upstream.status, headers });
    return new Response(streamingBody(upstream.body, upstreamController, request.signal), { status: upstream.status, headers });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof ApiError) {
      const status = [400, 404, 422].includes(error.status) ? error.status : 502;
      return errorResponse(error.message, status);
    }
    if (error instanceof DOMException && error.name === "TimeoutError") return errorResponse("Sumber video melewati batas waktu.", 504);
    return errorResponse("Video belum dapat dimuat.", 502);
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", abortUpstream);
  }
}

export async function GET(request: Request, context: Params) {
  return proxyMedia(request, context, "GET");
}

export async function HEAD(request: Request, context: Params) {
  return proxyMedia(request, context, "HEAD");
}
