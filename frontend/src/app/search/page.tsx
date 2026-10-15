import type { Metadata } from "next";
import { AnimeGrid } from "@/components/anime-grid";
import { DataNotice } from "@/components/data-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeading } from "@/components/page-heading";
import { SearchForm } from "@/components/search-form";
import { getSearch } from "@/lib/api";

type Props = { searchParams: Promise<{ query?: string | string[] }> };
export const dynamic = "force-dynamic";

function searchQuery(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = searchQuery((await searchParams).query);
  return { title: query ? `Pencarian ${query}` : "Cari Anime" };
}

export default async function SearchPage({ searchParams }: Props) {
  const query = searchQuery((await searchParams).query);

  if (!query) {
    return (
      <>
        <PageHeading eyebrow="Pencarian anime" title="Temukan judul untuk ditonton" description="Masukkan judul atau bagian judul anime yang ingin dicari." />
        <div className="shell py-10 md:py-12">
          <SearchForm />
          <div className="mt-12"><EmptyState icon="search" title="Mulai dengan sebuah judul" description="Hasil dari sumber akan muncul di halaman ini." /></div>
        </div>
      </>
    );
  }

  const response = await getSearch(query);
  const count = response.data.items.length;

  return (
    <>
      <PageHeading
        eyebrow="Pencarian anime"
        title={`Hasil untuk ${response.data.query}`}
        description={`${count} judul ditemukan dari maksimal ${response.data.max_results} hasil yang disediakan sumber.`}
      />
      <div className="shell py-10 md:py-12">
        <DataNotice meta={response.meta} />
        <SearchForm defaultValue={response.data.query} />
        <div className="mt-12">
          {count > 0
            ? <AnimeGrid items={response.data.items} context="search" />
            : <EmptyState icon="search" title="Tidak ada judul yang cocok" description="Coba kata kunci lain atau gunakan bagian judul yang lebih singkat." />}
        </div>
      </div>
    </>
  );
}
