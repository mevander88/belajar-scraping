export type Meta = {
  kind: string;
  source_url: string;
  fetched_at: string;
  count: number;
  cache: "hit" | "miss" | "stale" | "bypass" | string;
  warnings?: string[];
};

export type ApiResponse<T> = { meta: Meta; data: T };
export type Genre = { slug: string; name: string; url: string };
export type AnimeCardData = {
  slug: string; title: string; url: string; cover_url?: string;
  episode_text?: string; schedule_text?: string; updated_text?: string;
  score?: string; status?: string; studio?: string; release_text?: string;
  synopsis?: string; genres?: Genre[];
};
export type HomeData = { ongoing: AnimeCardData[]; complete: AnimeCardData[] };
export type CatalogItem = { slug: string; title: string; url: string; status?: string };
export type Pagination = { current: number; last: number; previous_url?: string; next_url?: string };
export type AnimeCollection = { items: AnimeCardData[]; pagination: Pagination };
export type ScheduleGroup = { day: string; items: CatalogItem[] };
export type EpisodeSummary = { slug: string; title: string; url: string; release_text?: string };
export type AnimeDetail = {
  slug: string; url: string; title: string; title_japan?: string; cover_url?: string;
  score?: string; producer?: string; type?: string; status?: string; total_episodes?: string;
  duration?: string; release_date?: string; release_date_raw?: string; studio?: string;
  genres: Genre[]; synopsis?: string; episodes: EpisodeSummary[]; batches: EpisodeSummary[];
};
export type Stream = { provider?: string; url: string };
export type DownloadLink = { provider: string; url: string };
export type DownloadGroup = { label: string; size?: string; links: DownloadLink[] };
export type EpisodeDetail = {
  slug: string; url: string; title: string; poster_url?: string;
  streams: Stream[]; episode_options: EpisodeSummary[]; downloads: DownloadGroup[];
};
