import type { AnimeCardData } from "@/lib/types";
import { AnimeCard } from "./anime-card";
import { EmptyState } from "./empty-state";

export function AnimeGrid({ items }: { items: AnimeCardData[] }) {
  if (!items.length) return <EmptyState title="Belum ada judul" description="Daftar anime ini masih kosong." />;
  return <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{items.map((anime, index) => <AnimeCard key={anime.slug} anime={anime} priority={index < 2} />)}</div>;
}
