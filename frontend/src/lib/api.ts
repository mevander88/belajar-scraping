import type {
  AnimeCollection, AnimeDetail, ApiResponse, CatalogItem, EpisodeDetail,
  Genre, HomeData, ScheduleGroup, SearchData,
} from "./types";

const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(/\/$/, "");
// Beri backend waktu menyelesaikan timeout scraping (20 detik) dan fallback cache stale.
const API_TIMEOUT_MS = 25_000;

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(503, "Layanan data belum dapat dihubungi.");
  }

  if (!response.ok) {
    let message = "Data belum dapat dimuat.";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch { /* gunakan pesan aman */ }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export const getHome = () => apiFetch<ApiResponse<HomeData>>("/api/v1/source/home");
export const getCatalog = () => apiFetch<ApiResponse<CatalogItem[]>>("/api/v1/source/catalog");
export const getSchedule = () => apiFetch<ApiResponse<ScheduleGroup[]>>("/api/v1/source/schedule");
export const getGenres = () => apiFetch<ApiResponse<Genre[]>>("/api/v1/source/genres");
export const getSearch = (query: string) => apiFetch<ApiResponse<SearchData>>(`/api/v1/source/search?${new URLSearchParams({ query })}`);
export const getGenre = (slug: string, page: number) => apiFetch<ApiResponse<AnimeCollection>>(`/api/v1/source/genres/${encodeURIComponent(slug)}?page=${page}`);
export const getAnimeCollection = (status: "ongoing" | "complete", page: number) => apiFetch<ApiResponse<AnimeCollection>>(`/api/v1/source/anime?status=${status}&page=${page}`);
export const getAnime = (slug: string) => apiFetch<ApiResponse<AnimeDetail>>(`/api/v1/source/anime/${encodeURIComponent(slug)}`);
export const getEpisode = (slug: string) => apiFetch<ApiResponse<EpisodeDetail>>(`/api/v1/source/episodes/${encodeURIComponent(slug)}`);
