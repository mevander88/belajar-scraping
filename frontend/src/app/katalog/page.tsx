import type { Metadata } from "next";
import Link from "next/link";
import { DataNotice } from "@/components/data-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { getCatalog } from "@/lib/api";
import type { CatalogItem } from "@/lib/types";
export const metadata: Metadata = { title: "Katalog A–Z" };
export const dynamic = "force-dynamic";
function groups(items: CatalogItem[]) { return items.reduce<Record<string, CatalogItem[]>>((result, item) => { const initial = /^[A-Z0-9]/i.test(item.title) ? item.title[0].toUpperCase() : "#"; (result[initial] ??= []).push(item); return result; }, {}); }
export default async function CatalogPage() { const response = await getCatalog(); const grouped = groups(response.data); return <><PageHeading index="04 / Indeks" eyebrow={`${response.meta.count} judul`} title="Katalog anime A–Z." description="Indeks lengkap untuk menemukan judul secara langsung." /><div className="shell py-12"><DataNotice meta={response.meta} />{Object.keys(grouped).length ? <div className="space-y-12">{Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([initial, items]) => <section key={initial} className="grid border-t border-ink pt-4 md:grid-cols-[7rem_1fr]"><h2 className="display-title text-6xl text-accent-dark">{initial}</h2><ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <li key={item.slug} className="border-b border-rule"><Link href={`/anime/${item.slug}`} className="flex justify-between gap-3 py-3 text-sm font-semibold hover:text-accent-dark"><span>{item.title}</span><span aria-hidden="true">→</span></Link></li>)}</ul></section>)}</div> : <EmptyState />}</div></>; }
