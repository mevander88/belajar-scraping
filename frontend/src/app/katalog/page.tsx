import type { Metadata } from "next";
import Link from "next/link";
import { DataNotice } from "@/components/data-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { Icon } from "@/components/icon";
import { getCatalog } from "@/lib/api";
import type { CatalogItem } from "@/lib/types";

export const metadata: Metadata = { title: "Katalog A–Z" };

function groups(items: CatalogItem[]) {
  return items.reduce<Record<string, CatalogItem[]>>((result, item) => {
    const initial = /^[A-Z0-9]/i.test(item.title) ? item.title[0].toUpperCase() : "#";
    (result[initial] ??= []).push(item);
    return result;
  }, {});
}

export default async function CatalogPage() {
  const response = await getCatalog();
  const grouped = groups(response.data);
  return (
    <>
      <PageHeading eyebrow={`${response.meta.count} judul`} title="Katalog anime A–Z" description="Daftar lengkap judul anime dari sumber yang tersedia." />
      <div className="shell py-8 md:py-10">
        <DataNotice meta={response.meta} />
        {Object.keys(grouped).length ? (
          <div className="space-y-8">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([initial, items]) => (
              <section key={initial} className="grid gap-3 border-t border-border pt-4 md:grid-cols-[4rem_1fr] md:gap-5">
                <h2 className="text-2xl font-bold text-secondary">{initial}</h2>
                <ul className="grid overflow-hidden rounded-xl border border-border bg-surface sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => <li key={item.slug} className="border-b border-r border-border"><Link href={`/anime/${item.slug}`} className="flex min-h-11 items-center justify-between gap-3 px-3 py-2.5 text-sm font-semibold leading-5 text-secondary transition-colors hover:bg-hover hover:text-foreground"><span>{item.title}</span><Icon name="arrow-right" className="size-4 shrink-0 text-focus" /></Link></li>)}
                </ul>
              </section>
            ))}
          </div>
        ) : <EmptyState />}
      </div>
    </>
  );
}
