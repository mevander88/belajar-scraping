import type { EpisodeSummary } from "./types";

function episodeNumber(title: string): number | null {
  const match = title.match(/\bepisode\s+(\d+(?:\.\d+)?)\b/i);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isFinite(number) ? number : null;
}

export function adjacentEpisodes(options: EpisodeSummary[], slug: string) {
  const current = options.find((option) => option.slug === slug);
  const number = current ? episodeNumber(current.title) : null;
  if (number === null) return { previous: null, next: null };

  const numbered = options
    .filter((option) => option.slug !== slug)
    .map((option) => ({ option, number: episodeNumber(option.title) }))
    .filter((item): item is { option: EpisodeSummary; number: number } => item.number !== null);

  const previous = numbered.filter((item) => item.number < number).sort((a, b) => b.number - a.number)[0]?.option ?? null;
  const next = numbered.filter((item) => item.number > number).sort((a, b) => a.number - b.number)[0]?.option ?? null;
  return { previous, next };
}
