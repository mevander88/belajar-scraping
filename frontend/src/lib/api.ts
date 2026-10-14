import "server-only";

import { cache } from "react";

import type {
  AnimeCollection, AnimeDetail, ApiResponse, CatalogItem, EpisodeDetail,
  Genre, HomeData, ScheduleGroup, SearchData, MediaStream,
} from "./types";

const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(/\/$/, "");
// Beri backend waktu menyelesaikan timeout scraping (20 detik) dan fallback cache stale.
const API_TIMEOUT_MS = 25_000;
const STREAM_RESOLUTION_TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, signal?: AbortSignal, timeoutMs = API_TIMEOUT_MS, revalidate?: number): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...(revalidate ? { next: { revalidate } } : { cache: "no-store" as const }),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs),
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

function encodeSlug(slug: string): string {
  try {
    const decoded = decodeURIComponent(slug);
    if (!decoded || decoded.includes("/") || decoded.includes("\\")) throw new Error("invalid path segment");
    return encodeURIComponent(decoded);
  } catch {
    throw new ApiError(400, "Alamat konten tidak valid.");
  }
}

export const getHome = () => apiFetch<ApiResponse<HomeData>>("/api/v1/source/home", undefined, API_TIMEOUT_MS, 300);
export const getCatalog = () => apiFetch<ApiResponse<CatalogItem[]>>("/api/v1/source/catalog", undefined, API_TIMEOUT_MS, 21600);
export const getSchedule = () => apiFetch<ApiResponse<ScheduleGroup[]>>("/api/v1/source/schedule", undefined, API_TIMEOUT_MS, 900);
export const getGenres = () => apiFetch<ApiResponse<Genre[]>>("/api/v1/source/genres", undefined, API_TIMEOUT_MS, 43200);
export const getSearch = (query: string) => apiFetch<ApiResponse<SearchData>>(`/api/v1/source/search?${new URLSearchParams({ query })}`);
export const getGenre = (slug: string, page: number) => apiFetch<ApiResponse<AnimeCollection>>(`/api/v1/source/genres/${encodeSlug(slug)}?page=${page}`, undefined, API_TIMEOUT_MS, 600);
export const getAnimeCollection = (status: "ongoing" | "complete", page: number) => apiFetch<ApiResponse<AnimeCollection>>(`/api/v1/source/anime?status=${status}&page=${page}`, undefined, API_TIMEOUT_MS, 600);
export const getAnime = cache((slug: string) => apiFetch<ApiResponse<AnimeDetail>>(`/api/v1/source/anime/${encodeSlug(slug)}`, undefined, API_TIMEOUT_MS, 3600));
export const getEpisode = cache((slug: string) => apiFetch<ApiResponse<EpisodeDetail>>(`/api/v1/source/episodes/${encodeSlug(slug)}`, undefined, API_TIMEOUT_MS, 300));
export const getStream = (slug: string, serverID: string, refresh = false, signal?: AbortSignal) => {
  const query = refresh ? "?refresh=true" : "";
  return apiFetch<MediaStream>(`/api/v1/source/episodes/${encodeSlug(slug)}/streams/${encodeSlug(serverID)}${query}`, signal, STREAM_RESOLUTION_TIMEOUT_MS);
};
