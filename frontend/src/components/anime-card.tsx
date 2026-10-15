import Image from "next/image";
import Link from "next/link";
import type { AnimeCardData } from "@/lib/types";
import { labelStatus } from "@/lib/query";
import { Icon } from "./icon";

export type AnimeCardContext = "ongoing" | "complete" | "search" | "genre";

function cardNote(anime: AnimeCardData, context: AnimeCardContext) {
  if (context === "search" && (anime.status === "ongoing" || anime.status === "complete")) return labelStatus(anime.status);
  if (anime.episode_text) return anime.episode_text;
  if (anime.schedule_text && context === "ongoing") return `Jadwal ${anime.schedule_text}`;
  if (anime.release_text) return `Rilis ${anime.release_text}`;
  if (anime.updated_text) return `Diperbarui ${anime.updated_text}`;
  if (anime.schedule_text) return `Jadwal ${anime.schedule_text}`;
  return "";
}

export function AnimeCard({ anime, context, priority = false }: { anime: AnimeCardData; context: AnimeCardContext; priority?: boolean }) {
  const note = cardNote(anime, context);
  return (
    <article className="group min-w-0">
      <Link href={`/anime/${anime.slug}`} className="block h-full overflow-hidden rounded-xl border border-border/70 bg-surface transition-colors hover:border-muted/70 hover:bg-elevated focus-visible:outline-offset-4">
        <div className="relative aspect-[3/4] overflow-hidden bg-elevated">
          {anime.cover_url ? <Image src={anime.cover_url} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" priority={priority} className="object-cover" /> : <div className="grid h-full place-items-center text-2xl font-bold text-muted">LA</div>}
          {anime.score && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-white/15 bg-canvas/90 px-2 py-1 text-xs font-bold text-foreground"><Icon name="star" className="size-3.5 text-warning" />{anime.score}</span>}
        </div>
        <div className="min-w-0 p-3 sm:p-3.5">
          {note && <p className="mb-1.5 text-xs font-medium leading-5 text-secondary">{note}</p>}
          <h3 className="text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-focus sm:text-base">{anime.title}</h3>
          {anime.studio && <p className="mt-1.5 text-xs leading-5 text-muted">{anime.studio}</p>}
        </div>
      </Link>
    </article>
  );
}
