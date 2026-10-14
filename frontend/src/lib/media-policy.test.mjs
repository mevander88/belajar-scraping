import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedMediaType, isAllowedMediaURL, isValidRange } from "./media-policy.mjs";

test("media URL hanya menerima HTTPS dari host yang diizinkan", () => {
  assert.equal(isAllowedMediaURL("https://cdn.odcloud.net/anime/video.mp4"), true);
  assert.equal(isAllowedMediaURL("https://ia801.example.archive.org/video.mp4"), true);
  assert.equal(isAllowedMediaURL("http://cdn.odcloud.net/video.mp4"), false);
  assert.equal(isAllowedMediaURL("https://example.com/video.mp4"), false);
  assert.equal(isAllowedMediaURL("https://user:secret@cdn.odcloud.net/video.mp4"), false);
});

test("media type dibatasi ke format file player", () => {
  assert.equal(isAllowedMediaType("video/mp4"), true);
  assert.equal(isAllowedMediaType("video/webm"), true);
  assert.equal(isAllowedMediaType("application/vnd.apple.mpegurl"), false);
});

test("Range hanya menerima satu rentang byte", () => {
  assert.equal(isValidRange(null), true);
  assert.equal(isValidRange("bytes=0-1023"), true);
  assert.equal(isValidRange("bytes=1024-"), true);
  assert.equal(isValidRange("bytes=-512"), true);
  assert.equal(isValidRange("bytes=0-10,20-30"), false);
  assert.equal(isValidRange("items=0-10"), false);
});
