import type { Metadata } from "next";
import Link from "next/link";
import { DataNotice } from "@/components/data-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { getGenres } from "@/lib/api";
export const metadata: Metadata = { title: "Genre" };
export const dynamic = "force-dynamic";
export default async function GenresPage() { const response = await getGenres(); return <><PageHeading index="03 / Genre" eyebrow="Jelajah berdasarkan suasana" title="Pilih dunia yang ingin dimasuki." /><div className="shell py-12"><DataNotice meta={response.meta} />{response.data.length ? <div className="grid border-t border-ink sm:grid-cols-2 lg:grid-cols-4">{response.data.map((genre, index) => <Link key={genre.slug} href={`/genres/${genre.slug}`} className="group flex min-h-28 items-end justify-between border-b border-r border-rule p-4 hover:bg-ink hover:text-paper"><span><small className="eyebrow block text-accent">{String(index + 1).padStart(2, "0")}</small><strong className="mt-2 block font-display text-2xl">{genre.name}</strong></span><span className="transition group-hover:translate-x-1">→</span></Link>)}</div> : <EmptyState />}</div></>; }
