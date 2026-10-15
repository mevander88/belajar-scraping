import assert from "node:assert/strict";
import test from "node:test";
import { adjacentEpisodes } from "./episode-navigation.ts";

const episode = (number) => ({ slug: `episode-${number}`, title: `Episode ${number}`, url: `/episode/${number}` });

test("navigasi mengikuti nomor episode, bukan posisi daftar terbaru dahulu", () => {
  const options = [episode(3), episode(2), episode(1)];
  assert.deepEqual(adjacentEpisodes(options, "episode-2"), { previous: options[2], next: options[0] });
  assert.deepEqual(adjacentEpisodes(options, "episode-1"), { previous: null, next: options[1] });
  assert.deepEqual(adjacentEpisodes(options, "episode-3"), { previous: options[1], next: null });
});

test("tidak membuat tautan untuk episode yang tidak dapat diidentifikasi", () => {
  const options = [episode(3), { slug: "special", title: "Special", url: "/episode/special" }, episode(1)];
  assert.deepEqual(adjacentEpisodes(options, "special"), { previous: null, next: null });
  assert.deepEqual(adjacentEpisodes(options, "missing"), { previous: null, next: null });
  assert.deepEqual(adjacentEpisodes(options, "episode-1"), { previous: null, next: options[0] });
});
