export const MAX_REDIRECTS = 3;
export const ALLOWED_MEDIA_TYPES = new Set(["video/mp4", "video/webm"]);
export const RANGE_PATTERN = /^bytes=(?:\d+-\d*|-\d+)$/;

export function isAllowedMediaURL(rawURL) {
  try {
    const parsed = new URL(rawURL);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    return host === "cdn.odcloud.net" || host === "archive.org" || host.endsWith(".archive.org");
  } catch {
    return false;
  }
}

export function isAllowedMediaType(contentType) {
  return ALLOWED_MEDIA_TYPES.has(contentType.toLowerCase());
}

export function isValidRange(range) {
  return range === null || RANGE_PATTERN.test(range);
}
