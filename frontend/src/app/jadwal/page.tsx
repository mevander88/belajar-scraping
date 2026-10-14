import type { Metadata } from "next";
import Link from "next/link";
import { DataNotice } from "@/components/data-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { getSchedule } from "@/lib/api";
export const metadata: Metadata = { title: "Jadwal Tayang" };
export const dynamic = "force-dynamic";
export default async function SchedulePage() { const response = await getSchedule(); return <><PageHeading index="02 / Jadwal" eyebrow="Tayang mingguan" title="Tujuh hari, banyak cerita." description="Susunan judul berdasarkan hari tayang dari sumber terbaru." /><div className="shell py-12"><DataNotice meta={response.meta} />{response.data.length ? <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-3">{response.data.map((group, index) => <section key={group.day} className="border-t border-ink pt-4"><p className="eyebrow text-accent-dark">{String(index + 1).padStart(2, "0")}</p><h2 className="mt-2 font-display text-4xl">{group.day}</h2><ol className="mt-5 divide-y divide-rule">{group.items.map((item) => <li key={item.slug}><Link href={`/anime/${item.slug}`} className="flex items-start justify-between gap-4 py-3 text-sm font-semibold hover:text-accent-dark"><span>{item.title}</span><span aria-hidden="true">↗</span></Link></li>)}</ol></section>)}</div> : <EmptyState />}</div></>; }
