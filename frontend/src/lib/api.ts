import type {
  AnimeCollection, AnimeDetail, ApiResponse, CatalogItem, EpisodeDetail,
  Genre, HomeData, Readiness, ScheduleGroup,
} from "./types";

const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(/\/$/, "");

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
      signal: AbortSignal.timeout(15_000),
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
export const getGenre = (slug: string, page: number) => apiFetch<ApiResponse<AnimeCollection>>(`/api/v1/source/genres/${encodeURIComponent(slug)}?page=${page}`);
export const getAnimeCollection = (status: "ongoing" | "complete", page: number) => apiFetch<ApiResponse<AnimeCollection>>(`/api/v1/source/anime?status=${status}&page=${page}`);
export const getAnime = (slug: string) => apiFetch<ApiResponse<AnimeDetail>>(`/api/v1/source/anime/${encodeURIComponent(slug)}`);
export const getEpisode = (slug: string) => apiFetch<ApiResponse<EpisodeDetail>>(`/api/v1/source/episodes/${encodeURIComponent(slug)}`);

export async function getReadiness(): Promise<{ api: boolean; data: Readiness }> {
  try {
    const response = await fetch(`${API_URL}/api/v1/ready`, { cache: "no-store", signal: AbortSignal.timeout(3_000) });
    const data = await response.json() as Readiness;
    return { api: true, data };
  } catch {
    return { api: false, data: { status: "unavailable" } };
  }
}
