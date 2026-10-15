import type { Metadata } from "next";
import Link from "next/link";
import { DataNotice } from "@/components/data-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { Icon } from "@/components/icon";
import { getGenres } from "@/lib/api";

export const metadata: Metadata = { title: "Genre" };

export default async function GenresPage() {
  const response = await getGenres();
  return (
    <>
      <PageHeading eyebrow="Jelajah berdasarkan genre" title="Pilih jenis cerita" description="Buka koleksi berdasarkan tema yang ingin ditonton." />
      <div className="shell py-8 md:py-10">
        <DataNotice meta={response.meta} />
        {response.data.length ? (
          <div className="grid overflow-hidden rounded-xl border border-border bg-surface sm:grid-cols-2 lg:grid-cols-4">
            {response.data.map((genre) => (
              <Link key={genre.slug} href={`/genres/${genre.slug}`} className="group flex min-h-20 items-center justify-between gap-4 border-b border-r border-border p-4 transition-colors hover:bg-hover">
                <strong className="text-base font-semibold text-foreground transition-colors group-hover:text-focus">{genre.name}</strong>
                <Icon name="arrow-right" className="size-4 text-focus" />
              </Link>
            ))}
          </div>
        ) : <EmptyState />}
      </div>
    </>
  );
}
