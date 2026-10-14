import type { Metadata } from "next";
import Link from "next/link";
import { DataNotice } from "@/components/data-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { getSchedule } from "@/lib/api";
export const metadata: Metadata = { title: "Jadwal Tayang" };
export default async function SchedulePage() { const response = await getSchedule(); return <><PageHeading eyebrow="Jadwal mingguan" title="Jadwal tayang anime" description="Temukan judul berdasarkan hari penayangannya." /><div className="shell py-10 md:py-12"><DataNotice meta={response.meta} />{response.data.length ? <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 xl:grid-cols-3">{response.data.map((group) => <section key={group.day} className="border-t-2 border-ink pt-4"><h2 className="font-display text-4xl">{group.day}</h2><ol className="mt-4 divide-y divide-rule">{group.items.map((item) => <li key={item.slug}><Link href={`/anime/${item.slug}`} className="flex min-h-11 items-start justify-between gap-4 py-3 text-sm font-semibold hover:text-accent-dark"><span>{item.title}</span><span aria-hidden="true">→</span></Link></li>)}</ol></section>)}</div> : <EmptyState />}</div></>; }
