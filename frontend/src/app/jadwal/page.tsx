import type { Metadata } from "next";
import Link from "next/link";
import { DataNotice } from "@/components/data-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { Icon } from "@/components/icon";
import { getSchedule } from "@/lib/api";

export const metadata: Metadata = { title: "Jadwal Tayang" };

export default async function SchedulePage() {
  const response = await getSchedule();
  return (
    <>
      <PageHeading eyebrow="Jadwal mingguan" title="Jadwal tayang anime" description="Temukan judul berdasarkan hari penayangannya." />
      <div className="shell py-8 md:py-10">
        <DataNotice meta={response.meta} />
        {response.data.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {response.data.map((group) => (
              <section key={group.day} className="overflow-hidden rounded-xl border border-border bg-surface">
                <h2 className="border-b border-border px-4 py-3 text-lg font-bold text-foreground">{group.day}</h2>
                <ol>{group.items.map((item) => <li key={item.slug}><Link href={`/anime/${item.slug}`} className="flex min-h-11 items-start justify-between gap-4 border-b border-border px-4 py-3 text-sm font-semibold leading-5 text-secondary transition-colors hover:bg-hover hover:text-foreground"><span>{item.title}</span><Icon name="arrow-right" className="mt-0.5 size-4 shrink-0 text-focus" /></Link></li>)}</ol>
              </section>
            ))}
          </div>
        ) : <EmptyState />}
      </div>
    </>
  );
}
