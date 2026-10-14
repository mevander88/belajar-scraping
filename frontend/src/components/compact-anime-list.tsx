import Image from "next/image";
import Link from "next/link";
import type { AnimeCardData } from "@/lib/types";
import { EmptyState } from "./empty-state";

export function CompactAnimeList({ items }: { items: AnimeCardData[] }) {
  if (!items.length) return <EmptyState title="Belum ada judul" description="Arsip anime ini masih kosong." />;
  return (
    <div className="grid border-t border-ink md:grid-cols-2">
      {items.map((anime) => (
        <Link key={anime.slug} href={`/anime/${anime.slug}`} className="group grid grid-cols-[4.5rem_1fr_auto] gap-4 border-b border-rule py-4 md:odd:border-r md:odd:pr-5 md:even:pl-5">
          <div className="relative aspect-[3/4] overflow-hidden bg-paper-deep">
            {anime.cover_url ? <Image src={anime.cover_url} alt="" fill sizes="72px" className="object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center font-display italic text-muted">LA</div>}
          </div>
          <div className="self-center">
            <h3 className="font-display text-xl leading-tight group-hover:text-accent-dark">{anime.title}</h3>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted">{anime.release_text || anime.updated_text || anime.studio || "Tamat"}</p>
          </div>
          <span className="self-center text-accent-dark" aria-hidden="true">→</span>
        </Link>
      ))}
    </div>
  );
}
