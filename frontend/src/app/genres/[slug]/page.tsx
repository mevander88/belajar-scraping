import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnimeGrid } from "@/components/anime-grid";
import { DataNotice } from "@/components/data-notice";
import { PageHeading } from "@/components/page-heading";
import { Pagination } from "@/components/pagination";
import { ApiError, getGenre } from "@/lib/api";
import { positivePage } from "@/lib/query";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string | string[] }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { slug } = await params; return { title: `Genre ${decodeURIComponent(slug).replaceAll("-", " ")}` }; }
async function loadGenre(slug: string, page: number) {
  try { return await getGenre(slug, page); }
  catch (error) { if (error instanceof ApiError && (error.status === 400 || error.status === 404)) notFound(); throw error; }
}
export default async function GenrePage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]); const page = positivePage(query.page);
  const response = await loadGenre(slug, page);
  const label = decodeURIComponent(slug).replaceAll("-", " ");
  return <><PageHeading eyebrow={`Genre · Halaman ${response.data.pagination.current}`} title={label} description="Pilih judul untuk melihat informasi dan episode yang tersedia." /><div className="shell py-10 md:py-12"><DataNotice meta={response.meta} /><AnimeGrid items={response.data.items} /><Pagination current={response.data.pagination.current} last={response.data.pagination.last} basePath={`/genres/${slug}`} /></div></>;
}
