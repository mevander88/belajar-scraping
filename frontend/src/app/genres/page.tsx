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
          <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
            {response.data.map((genre) => (
              <Link key={genre.slug} href={`/genres/${genre.slug}`} className="group flex min-h-18 items-center justify-between gap-4 border-b border-border px-3 py-3 transition-colors hover:bg-surface focus-visible:outline-offset-2">
                <strong className="text-base font-semibold text-foreground transition-colors group-hover:text-focus">{genre.name}</strong>
                <Icon name="arrow-right" className="size-4 text-muted transition-colors group-hover:text-focus" />
              </Link>
            ))}
          </div>
        ) : <EmptyState />}
      </div>
    </>
  );
}
