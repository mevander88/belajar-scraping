import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataNotice } from "@/components/data-notice";
import { EmptyState } from "@/components/empty-state";
import { StreamPlayer } from "@/components/stream-player";
import { Icon } from "@/components/icon";
import { ApiError, getEpisode } from "@/lib/api";
import { adjacentEpisodes } from "@/lib/episode-navigation";

type Props = { params: Promise<{ slug: string }> };

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
  const { previous, next } = adjacentEpisodes(episode.episode_options, slug);

  return (
    <div className="shell py-8 md:py-10">
      <DataNotice meta={response.meta} />
      <header className="mb-6 border-b border-border pb-5 md:mb-8 md:pb-6">
        <p className="kicker">Episode anime</p>
        <h1 className="page-title mt-2 text-balance">{episode.title}</h1>
      </header>
      <StreamPlayer key={episode.slug} servers={episode.servers} slug={episode.slug} title={episode.title} />

      {(previous || next) && <nav aria-label="Navigasi episode" className="mt-5 flex flex-wrap gap-3">
        {previous && <Link href={`/episode/${previous.slug}`} className="button-secondary inline-flex max-w-full min-w-0 items-center gap-2"><Icon name="arrow-left" className="size-4 shrink-0" /><span className="min-w-0 break-words">Episode sebelumnya<span className="ml-1 text-muted">· {previous.title}</span></span></Link>}
        {next && <Link href={`/episode/${next.slug}`} className="button-secondary inline-flex max-w-full min-w-0 items-center gap-2"><span className="min-w-0 break-words">Episode berikutnya<span className="ml-1 text-muted">· {next.title}</span></span><Icon name="arrow-right" className="size-4 shrink-0" /></Link>}
      </nav>}

      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-12">
        <section>
          <p className="kicker">Episode lain</p>
          <h2 className="section-title mt-1.5">Lanjut menonton</h2>
          {episode.episode_options.length ? <ol className="mt-4 max-h-[32rem] overflow-y-auto rounded-xl border border-border bg-surface">{episode.episode_options.map((item) => <li key={item.slug}><Link href={`/episode/${item.slug}`} aria-current={item.slug === slug ? "page" : undefined} className={`flex min-h-11 items-center justify-between gap-4 border-b border-border px-3 py-3 text-sm font-semibold transition-colors ${item.slug === slug ? "bg-hover text-focus" : "text-foreground hover:bg-hover"}`}><span>{item.title}</span><Icon name="arrow-right" className="size-4 shrink-0" /></Link></li>)}</ol> : <div className="mt-4"><EmptyState icon="play-circle" /></div>}
        </section>
        <section>
          <p className="kicker">Unduhan</p>
          <h2 className="section-title mt-1.5">Pilihan berkas</h2>
          {episode.downloads.length ? <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">{episode.downloads.map((group) => <div key={`${group.label}-${group.size}`} className="border-b border-border p-4"><div className="flex justify-between gap-4"><h3 className="font-semibold text-foreground">{group.label}</h3>{group.size && <span className="text-sm text-muted">{group.size}</span>}</div><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">{group.links.map((link, index) => <a key={`${link.url}-${index}`} href={link.url} target="_blank" rel="noreferrer" className="text-link inline-flex items-center gap-1.5 text-sm">{link.provider}<Icon name="external-link" className="size-4" /></a>)}</div></div>)}</div> : <div className="mt-4"><EmptyState title="Unduhan belum tersedia" /></div>}
        </section>
      </div>
    </div>
  );
}
