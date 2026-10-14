import type { Metadata } from "next";
import Link from "next/link";
import { DataNotice } from "@/components/data-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { getGenres } from "@/lib/api";
export const metadata: Metadata = { title: "Genre" };
export const dynamic = "force-dynamic";
export default async function GenresPage() { const response = await getGenres(); return <><PageHeading eyebrow="Jelajah berdasarkan genre" title="Pilih jenis cerita" description="Buka koleksi berdasarkan tema yang ingin ditonton." /><div className="shell py-10 md:py-12"><DataNotice meta={response.meta} />{response.data.length ? <div className="grid border-t border-ink sm:grid-cols-2 lg:grid-cols-4">{response.data.map((genre) => <Link key={genre.slug} href={`/genres/${genre.slug}`} className="group flex min-h-24 items-center justify-between border-b border-rule p-4 sm:border-r hover:bg-ink hover:text-paper"><strong className="font-display text-2xl">{genre.name}</strong><span className="transition group-hover:translate-x-1" aria-hidden="true">→</span></Link>)}</div> : <EmptyState />}</div></>; }
