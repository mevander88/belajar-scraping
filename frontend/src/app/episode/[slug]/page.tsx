import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataNotice } from "@/components/data-notice";
import { EmptyState } from "@/components/empty-state";
import { StreamPlayer } from "@/components/stream-player";
import { ApiError, getEpisode } from "@/lib/api";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try { const response = await getEpisode(slug); return { title: response.data.title }; }
  catch { return { title: "Episode Anime" }; }
}

async function loadEpisode(slug: string) {
  try { return await getEpisode(slug); }
  catch (error) { if (error instanceof ApiError && (error.status === 400 || error.status === 404)) notFound(); throw error; }
}

export default async function EpisodePage({ params }: Props) {
  const { slug } = await params;
  const response = await loadEpisode(slug);
  const episode = response.data;

  return (
    <div className="shell py-8 md:py-12">
      <DataNotice meta={response.meta} />
      <header className="mb-7 border-b border-ink pb-6 md:mb-8">
        <p className="eyebrow text-accent-dark">Episode anime</p>
        <h1 className="display-title mt-3 max-w-5xl text-[clamp(2.5rem,5vw,5rem)] text-balance">{episode.title}</h1>
      </header>
      <StreamPlayer streams={episode.streams} title={episode.title} />

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <section>
          <p className="eyebrow text-accent-dark">Episode lain</p>
          <h2 className="mt-2 font-display text-4xl">Lanjut menonton</h2>
          {episode.episode_options.length ? <ol className="mt-4 max-h-[32rem] overflow-y-auto border-t border-ink">{episode.episode_options.map((item) => <li key={item.slug}><Link href={`/episode/${item.slug}`} aria-current={item.slug === slug ? "page" : undefined} className={`flex min-h-11 justify-between gap-4 border-b border-rule py-3 text-sm font-semibold ${item.slug === slug ? "text-accent-dark" : "hover:text-accent-dark"}`}><span>{item.title}</span><span aria-hidden="true">→</span></Link></li>)}</ol> : <div className="mt-4"><EmptyState /></div>}
        </section>
        <section>
          <p className="eyebrow text-accent-dark">Unduhan</p>
          <h2 className="mt-2 font-display text-4xl">Pilihan berkas</h2>
          {episode.downloads.length ? <div className="mt-4 border-t border-ink">{episode.downloads.map((group) => <div key={`${group.label}-${group.size}`} className="border-b border-rule py-5"><div className="flex justify-between gap-4"><h3 className="font-bold">{group.label}</h3>{group.size && <span className="text-sm text-muted">{group.size}</span>}</div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">{group.links.map((link, index) => <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer" className="link-line text-sm font-bold">{link.provider} ↗</a>)}</div></div>)}</div> : <div className="mt-4"><EmptyState title="Unduhan belum tersedia" /></div>}
        </section>
      </div>
    </div>
  );
}
