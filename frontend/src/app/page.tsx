import Image from "next/image";
import Link from "next/link";
import { AnimeGrid } from "@/components/anime-grid";
import { CompactAnimeList } from "@/components/compact-anime-list";
import { DataNotice } from "@/components/data-notice";
import { SectionHeading } from "@/components/section-heading";
import { Icon } from "@/components/icon";
import { getHome } from "@/lib/api";

export default async function Home() {
  const response = await getHome();
  const [featured, ...ongoing] = response.data.ongoing;

  return (
    <>
      {featured ? (
        <section className="relative isolate -mt-18 min-h-[32rem] overflow-hidden border-b border-border bg-surface md:min-h-0">
          {featured.cover_url && (
            <>
              <Image
                src={featured.cover_url}
                alt=""
                fill
                priority
                sizes="100vw"
                className="-z-20 object-cover object-center"
                aria-hidden="true"
              />
              <div className="absolute inset-0 -z-10 bg-black/80" aria-hidden="true" />
            </>
          )}
          <div className="shell grid min-h-[32rem] content-center gap-8 pb-8 pt-26 md:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center lg:gap-14 lg:pb-10 lg:pt-28">
            <div className="min-w-0">
              <p className="kicker">Sedang tayang</p>
              <h1 className="feature-title mt-3 text-balance">{featured.title}</h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-secondary">
                {featured.episode_text && <span>{featured.episode_text}</span>}
                {featured.schedule_text && <span>{featured.schedule_text}</span>}
                {featured.score && <span>Skor {featured.score}</span>}
              </div>
              {featured.synopsis && <p className="mt-4 max-w-2xl text-[15px] leading-7 text-secondary md:text-base">{featured.synopsis}</p>}
              <Link href={`/anime/${featured.slug}`} className="button-primary mt-6 inline-flex items-center justify-center gap-2">Lihat detail dan episode<Icon name="arrow-right" className="size-4" /></Link>
            </div>
            <Link href={`/anime/${featured.slug}`} className="relative mx-auto hidden aspect-[3/4] w-full max-w-[22rem] overflow-hidden rounded-xl border border-border bg-elevated md:block lg:mx-0 lg:justify-self-end">
              {featured.cover_url ? <Image src={featured.cover_url} alt={`Sampul ${featured.title}`} fill priority sizes="(max-width: 1024px) 352px, 384px" className="object-cover" /> : <div className="grid h-full place-items-center text-3xl font-bold text-muted">LA</div>}
            </Link>
          </div>
        </section>
      ) : (
        <section className="-mt-18 border-b border-border bg-surface"><div className="shell pb-10 pt-28"><p className="kicker">Layar Anime</p><h1 className="page-title mt-2">Arsip tayangan anime.</h1></div></section>
      )}

      <div className="shell py-10 md:py-12">
        <DataNotice meta={response.meta} />
        <section>
          <SectionHeading label="Tayang sekarang" title="Anime berjalan" href="/anime?status=ongoing" />
          <AnimeGrid items={ongoing} />
        </section>
        <section className="mt-14 md:mt-16">
          <SectionHeading label="Arsip terbaru" title="Sudah tamat" href="/anime?status=complete" />
          <CompactAnimeList items={response.data.complete} />
        </section>
      </div>
    </>
  );
}
