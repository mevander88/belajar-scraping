import Image from "next/image";
import Link from "next/link";
import type { AnimeCardData } from "@/lib/types";
import { Icon } from "./icon";

export function AnimeCard({ anime, priority = false }: { anime: AnimeCardData; priority?: boolean }) {
  const note = anime.episode_text || anime.release_text || anime.schedule_text || anime.updated_text;
  return (
    <article className="group min-w-0">
      <Link href={`/anime/${anime.slug}`} className="block rounded-xl focus-visible:outline-offset-4">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-surface">
          {anime.cover_url ? <Image src={anime.cover_url} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" priority={priority} className="object-cover" /> : <div className="grid h-full place-items-center text-2xl font-bold text-muted">LA</div>}
          {anime.score && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-canvas/90 px-2 py-1 text-xs font-bold text-foreground"><Icon name="star" className="size-3.5 text-warning" />{anime.score}</span>}
        </div>
        <div className="pt-3">
          {note && <p className="mb-1.5 text-xs font-semibold leading-5 text-secondary">{note}</p>}
          <h3 className="text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-focus">{anime.title}</h3>
          {anime.studio && <p className="mt-1 text-xs leading-5 text-muted">{anime.studio}</p>}
        </div>
      </Link>
    </article>
  );
}
