import Image from "next/image";
import Link from "next/link";
import type { AnimeCardData } from "@/lib/types";
import { EmptyState } from "./empty-state";
import { Icon } from "./icon";

export function CompactAnimeList({ items }: { items: AnimeCardData[] }) {
  if (!items.length) return <EmptyState title="Belum ada judul" description="Arsip anime ini masih kosong." />;
  return (
    <div className="grid overflow-hidden rounded-xl border border-border bg-surface md:grid-cols-2">
      {items.map((anime) => (
        <Link key={anime.slug} href={`/anime/${anime.slug}`} className="group grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)_auto] gap-4 border-b border-border p-4 transition-colors hover:bg-hover md:odd:border-r">
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-elevated">
            {anime.cover_url ? <Image src={anime.cover_url} alt="" fill sizes="72px" className="object-cover" /> : <div className="grid h-full place-items-center text-sm font-bold text-muted">LA</div>}
          </div>
          <div className="min-w-0 self-center">
            <h3 className="text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-focus sm:text-base">{anime.title}</h3>
            <p className="mt-1.5 text-xs leading-5 text-muted">{anime.release_text ? `Rilis ${anime.release_text}` : anime.updated_text ? `Diperbarui ${anime.updated_text}` : anime.studio || "Tamat"}</p>
          </div>
          <Icon name="arrow-right" className="size-4 self-center text-focus" />
        </Link>
      ))}
    </div>
  );
}
