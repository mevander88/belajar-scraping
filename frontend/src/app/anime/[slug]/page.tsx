import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataNotice } from "@/components/data-notice";
import { EmptyState } from "@/components/empty-state";
import { Icon } from "@/components/icon";
import { ApiError, getAnime } from "@/lib/api";
import { labelStatus } from "@/lib/query";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const response = await getAnime(slug);
    return { title: response.data.title, description: response.data.synopsis?.slice(0, 155) };
  } catch {
    return { title: "Detail Anime" };
  }
}

async function loadAnime(slug: string) {
  try { return await getAnime(slug); }
  catch (error) { if (error instanceof ApiError && (error.status === 400 || error.status === 404)) notFound(); throw error; }
}

export default async function AnimeDetailPage({ params }: Props) {
  const { slug } = await params;
  const response = await loadAnime(slug);
  const anime = response.data;
  const facts = [
    ["Skor", anime.score], ["Status", labelStatus(anime.status)],
    ["Episode", anime.total_episodes], ["Durasi", anime.duration],
    ["Studio", anime.studio], ["Produser", anime.producer],
    ["Tipe", anime.type], ["Rilis", anime.release_date || anime.release_date_raw],
  ].filter((item) => item[1]);

  return (
    <div className="shell py-7 md:py-9">
      <DataNotice meta={response.meta} />
      <header className="anime-detail-header border-b border-border pb-7 md:pb-9">
        <div className="anime-detail-cover relative mx-auto aspect-[3/4] w-full max-w-[17rem] overflow-hidden rounded-lg border border-border/70 bg-surface sm:max-w-xs lg:mx-0 lg:max-w-none">
          {anime.cover_url ? <Image src={anime.cover_url} alt={`Sampul ${anime.title}`} fill priority sizes="(max-width: 1024px) 320px, 320px" className="object-cover" /> : <div className="grid h-full place-items-center text-3xl font-bold text-muted">LA</div>}
        </div>
        <div className="anime-detail-intro min-w-0">
          <p className="kicker">{anime.type || "Anime"} · {labelStatus(anime.status)}</p>
          <h1 className="feature-title mt-2 text-balance">{anime.title}</h1>
          {anime.title_japan && <p className="mt-3 text-sm leading-6 text-secondary md:text-base">{anime.title_japan}</p>}
          {anime.episodes.length > 0 && <a href="#daftar-episode" className="button-primary mt-6 inline-flex items-center justify-center gap-2">Lihat daftar episode<Icon name="arrow-right" className="size-4" /></a>}
        </div>
        <div className="anime-detail-facts">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4 lg:gap-x-6">
            {facts.map(([term, value]) => {
              const unknown = /^(unknown|n\/a)$/i.test(value?.trim() ?? "");
              return <div key={term} className="min-w-0 border-t border-border pt-2.5"><dt className="text-xs font-semibold text-muted">{term}</dt><dd className={`mt-1 break-words text-sm font-semibold leading-5 ${unknown ? "text-muted" : "text-foreground"}`}>{unknown ? "Belum diketahui" : value}</dd></div>;
            })}
          </dl>
          {anime.genres.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{anime.genres.map((genre) => <Link key={genre.slug} href={`/genres/${genre.slug}`} className="inline-flex min-h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium text-secondary transition-colors hover:border-muted/70 hover:bg-elevated hover:text-foreground">{genre.name}</Link>)}</div>}
        </div>
      </header>

      <div className="grid gap-8 py-7 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-12 lg:py-9">
        <section>
          <p className="kicker">Sinopsis</p>
          <h2 className="section-title mt-1.5">Tentang cerita</h2>
          <p className="mt-3 max-w-[65ch] whitespace-pre-line text-[15px] leading-7 text-secondary">{anime.synopsis || "Sinopsis belum tersedia."}</p>
        </section>
        <section id="daftar-episode" className="scroll-mt-24">
          <p className="kicker">Tonton berikutnya</p>
          <h2 className="section-title mt-1.5">Daftar episode</h2>
          {anime.episodes.length ? <ul className="mt-4 max-h-[42rem] divide-y divide-border overflow-y-auto border-y border-border">{anime.episodes.map((episode) => <li key={episode.slug}><Link href={`/episode/${episode.slug}`} className="group flex min-h-11 items-center justify-between gap-3 px-3 py-3 transition-colors hover:bg-surface focus-visible:outline-offset-[-2px]"><span className="min-w-0"><strong className="block break-words text-sm font-semibold leading-5 text-foreground transition-colors group-hover:text-focus">{episode.title}</strong>{episode.release_text && <small className="mt-1 block text-xs text-muted sm:hidden">{episode.release_text}</small>}</span><span className="flex shrink-0 items-center gap-2"><small className="hidden text-muted sm:block">{episode.release_text}</small><Icon name="play" className="size-4 text-muted transition-colors group-hover:text-focus" /></span></Link></li>)}</ul> : <div className="mt-4"><EmptyState icon="play-circle" title="Episode belum tersedia" /></div>}
          {anime.batches.length > 0 && <div className="mt-8"><h3 className="text-xs font-semibold text-muted">Paket batch dari sumber</h3><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">{anime.batches.map((batch) => <a key={batch.slug} href={batch.url} target="_blank" rel="noreferrer" className="text-link inline-flex items-center gap-1.5 text-sm">{batch.title}<Icon name="external-link" className="size-4" /></a>)}</div></div>}
        </section>
      </div>
    </div>
  );
}
