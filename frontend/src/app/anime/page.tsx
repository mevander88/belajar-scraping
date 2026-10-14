import type { Metadata } from "next";
import { AnimeGrid } from "@/components/anime-grid";
import { CollectionError } from "@/components/collection-error";
import { DataNotice } from "@/components/data-notice";
import { PageHeading } from "@/components/page-heading";
import { Pagination } from "@/components/pagination";
import { ApiError, getAnimeCollection } from "@/lib/api";
import { positivePage } from "@/lib/query";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Daftar Anime" };

async function loadCollection(status: "ongoing" | "complete", page: number) {
  try {
    return await getAnimeCollection(status, page);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    if (error instanceof ApiError) return error;
    throw error;
  }
}

export default async function AnimePage({ searchParams }: { searchParams: Promise<{ status?: string | string[]; page?: string | string[] }> }) {
  const query = await searchParams;
  const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
  if (rawStatus && rawStatus !== "ongoing" && rawStatus !== "complete") notFound();
  const status = rawStatus === "complete" ? "complete" : "ongoing";
  const page = positivePage(query.page);
  const title = status === "complete" ? "Anime yang telah tamat" : "Anime yang sedang berjalan";
  const label = status === "complete" ? "Koleksi tamat" : "Tayang sekarang";
  const response = await loadCollection(status, page);
  if (response instanceof ApiError) {
    return <><PageHeading eyebrow={`${label} · Halaman ${page}`} title={title} description="Pilih judul untuk melihat informasi tayang dan daftar episode." /><CollectionError status={response.status} label={status === "complete" ? "tamat" : "berjalan"} /></>;
  }
  return <><PageHeading eyebrow={`${label} · Halaman ${response.data.pagination.current}`} title={title} description="Pilih judul untuk melihat informasi tayang dan daftar episode." /><div className="shell py-10 md:py-12"><DataNotice meta={response.meta} /><AnimeGrid items={response.data.items} /><Pagination current={response.data.pagination.current} last={response.data.pagination.last} basePath="/anime" params={{ status }} /></div></>;
}
