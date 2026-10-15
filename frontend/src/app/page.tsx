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
        <section className="relative isolate -mt-18 min-h-[32rem] overflow-hidden bg-surface md:min-h-0">
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
              <div className="hero-scrim absolute inset-0 -z-10" aria-hidden="true" />
            </>
          )}
          <div className="shell grid min-h-[32rem] content-center gap-8 pb-8 pt-26 md:min-h-0 md:grid-cols-[minmax(0,1fr)_minmax(14rem,17rem)] md:items-center lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:gap-14 lg:pb-10 lg:pt-28">
            <div className="min-w-0">
              <p className="kicker text-white/80">Sedang tayang</p>
              <h1 className="feature-title mt-3 text-balance">{featured.title}</h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/85">
                {featured.episode_text && <span>{featured.episode_text}</span>}
                {featured.schedule_text && <span>{featured.schedule_text}</span>}
                {featured.score && <span>Skor {featured.score}</span>}
              </div>
              {featured.synopsis && <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/80 md:text-base">{featured.synopsis}</p>}
              <Link href={`/anime/${featured.slug}`} className="button-primary mt-6 inline-flex items-center justify-center gap-2">Lihat detail dan episode<Icon name="arrow-right" className="size-4" /></Link>
            </div>
            <Link href={`/anime/${featured.slug}`} className="relative mx-auto hidden aspect-[3/4] w-full max-w-[22rem] overflow-hidden rounded-lg bg-elevated md:mx-0 md:block md:max-w-[17rem] md:justify-self-end lg:max-w-[22rem]">
              {featured.cover_url ? <Image src={featured.cover_url} alt={`Sampul ${featured.title}`} fill priority sizes="(max-width: 1023px) 272px, 352px" className="object-cover" /> : <div className="grid h-full place-items-center text-3xl font-bold text-muted">LA</div>}
            </Link>
          </div>
        </section>
      ) : (
        <section className="-mt-18 bg-surface"><div className="shell pb-10 pt-28"><p className="kicker">Layar Anime</p><h1 className="page-title mt-2">Arsip tayangan anime.</h1></div></section>
      )}

      <div className="shell py-8 md:py-10">
        <DataNotice meta={response.meta} />
        <section>
          <SectionHeading label="Tayang sekarang" title="Anime berjalan" href="/anime?status=ongoing" />
          <AnimeGrid items={ongoing} context="ongoing" />
        </section>
        <section className="mt-12 md:mt-14">
          <SectionHeading label="Arsip terbaru" title="Sudah tamat" href="/anime?status=complete" />
          <CompactAnimeList items={response.data.complete} />
        </section>
      </div>
    </>
  );
}
