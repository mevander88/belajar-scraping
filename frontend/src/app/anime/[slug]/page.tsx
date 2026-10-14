import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataNotice } from "@/components/data-notice";
import { EmptyState } from "@/components/empty-state";
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
    <div className="shell py-8 md:py-12">
      <DataNotice meta={response.meta} />
      <header className="anime-detail-header border-b border-ink pb-10 md:pb-12">
        <div className="anime-detail-cover relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden bg-paper-deep md:mx-0 md:max-w-none">
          {anime.cover_url ? <Image src={anime.cover_url} alt={`Sampul ${anime.title}`} fill priority sizes="(max-width: 768px) 384px, 352px" className="object-cover" /> : <div className="grid h-full place-items-center font-display text-6xl italic text-muted/40">LA</div>}
        </div>
        <div className="anime-detail-intro">
          <p className="eyebrow text-accent-dark">{anime.type || "Anime"} · {labelStatus(anime.status)}</p>
          <h1 className="display-title mt-3 max-w-5xl text-[clamp(3rem,6vw,6.5rem)] text-balance">{anime.title}</h1>
          {anime.title_japan && <p className="mt-3 text-base text-muted md:text-lg">{anime.title_japan}</p>}
        </div>
        <div className="anime-detail-facts">
          <dl className="grid grid-cols-2 border-t border-ink sm:grid-cols-4">
            {facts.map(([term, value]) => <div key={term} className="border-b border-r border-rule py-3 pr-3"><dt className="text-xs font-bold uppercase tracking-wider text-muted">{term}</dt><dd className="mt-1.5 text-sm font-semibold md:text-base">{value}</dd></div>)}
          </dl>
          {anime.genres.length > 0 && <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">{anime.genres.map((genre) => <Link key={genre.slug} href={`/genres/${genre.slug}`} className="link-line text-sm font-bold">{genre.name}</Link>)}</div>}
        </div>
      </header>

      <div className="grid gap-12 py-10 lg:grid-cols-[.7fr_1.3fr] lg:py-12">
        <section>
          <p className="eyebrow text-accent-dark">Sinopsis</p>
          <h2 className="mt-2 font-display text-4xl">Tentang cerita</h2>
          <p className="mt-4 whitespace-pre-line text-base leading-8 text-muted">{anime.synopsis || "Sinopsis belum tersedia."}</p>
        </section>
        <section>
          <p className="eyebrow text-accent-dark">Tonton berikutnya</p>
          <h2 className="mt-2 font-display text-4xl">Daftar episode</h2>
          {anime.episodes.length ? <ol className="mt-4 max-h-[42rem] overflow-y-auto border-t border-ink">{anime.episodes.map((episode, index) => <li key={episode.slug}><Link href={`/episode/${episode.slug}`} className="grid min-h-11 grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-rule py-3 hover:text-accent-dark"><span className="text-xs font-bold text-muted">{String(index + 1).padStart(2, "0")}</span><strong className="text-sm">{episode.title}</strong><small className="hidden text-muted sm:block">{episode.release_text}</small></Link></li>)}</ol> : <div className="mt-4"><EmptyState title="Episode belum tersedia" /></div>}
          {anime.batches.length > 0 && <div className="mt-8"><h3 className="text-xs font-bold uppercase tracking-wider text-muted">Paket batch dari sumber</h3><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">{anime.batches.map((batch) => <a key={batch.slug} href={batch.url} target="_blank" rel="noreferrer" className="link-line text-sm font-bold">{batch.title} ↗</a>)}</div></div>}
        </section>
      </div>
    </div>
  );
}
