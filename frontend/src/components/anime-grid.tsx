import type { AnimeCardData } from "@/lib/types";
import { AnimeCard, type AnimeCardContext } from "./anime-card";
import { EmptyState } from "./empty-state";

export function AnimeGrid({ items, context }: { items: AnimeCardData[]; context: AnimeCardContext }) {
  if (!items.length) return <EmptyState title="Belum ada judul" description="Daftar anime ini masih kosong." />;
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-5">{items.map((anime, index) => <AnimeCard key={anime.slug} anime={anime} context={context} priority={index < 2} />)}</div>;
}
