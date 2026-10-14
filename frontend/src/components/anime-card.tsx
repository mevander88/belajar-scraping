import Image from "next/image";
import Link from "next/link";
import type { AnimeCardData } from "@/lib/types";

export function AnimeCard({ anime, priority = false }: { anime: AnimeCardData; priority?: boolean }) {
  const note = anime.episode_text || anime.release_text || anime.schedule_text || anime.updated_text;
  return (
    <article className="group border-t border-ink pt-3">
      <Link href={`/anime/${anime.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-paper-deep">
          {anime.cover_url ? <Image src={anime.cover_url} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" priority={priority} className="object-cover transition duration-500 group-hover:scale-[1.025]" /> : <div className="grid h-full place-items-center font-display text-5xl italic text-muted/40">LA</div>}
          {anime.score && <span className="absolute right-0 top-0 bg-ink px-2.5 py-1.5 text-xs font-bold text-paper">★ {anime.score}</span>}
        </div>
        <div className="pt-4">
          {note && <p className="eyebrow mb-2 text-accent-dark">{note}</p>}
          <h3 className="font-display text-xl leading-tight tracking-tight group-hover:text-accent-dark sm:text-2xl">{anime.title}</h3>
          {anime.studio && <p className="mt-1 text-xs font-bold uppercase tracking-wider text-muted">{anime.studio}</p>}
        </div>
      </Link>
    </article>
  );
}
