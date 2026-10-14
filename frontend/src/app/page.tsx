import Image from "next/image";
import Link from "next/link";
import { AnimeGrid } from "@/components/anime-grid";
import { CompactAnimeList } from "@/components/compact-anime-list";
import { DataNotice } from "@/components/data-notice";
import { SectionHeading } from "@/components/section-heading";
import { getHome } from "@/lib/api";

export default async function Home() {
  const response = await getHome();
  const [featured, ...ongoing] = response.data.ongoing;

  return (
    <>
      {featured ? (
        <section className="editorial-grid border-b border-ink">
          <div className="shell grid gap-8 py-8 md:grid-cols-[1.15fr_.85fr] md:items-center md:py-12 lg:gap-16">
            <div>
              <p className="eyebrow text-accent-dark">Sedang tayang</p>
              <h1 className="display-title mt-4 max-w-4xl text-[clamp(3.4rem,7vw,7.5rem)] text-balance">{featured.title}</h1>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-muted">
                {featured.episode_text && <span>{featured.episode_text}</span>}
                {featured.schedule_text && <span>{featured.schedule_text}</span>}
                {featured.score && <span>Skor {featured.score}</span>}
              </div>
              {featured.synopsis && <p className="mt-6 max-w-2xl text-base leading-7 text-muted md:text-lg">{featured.synopsis}</p>}
              <Link href={`/anime/${featured.slug}`} className="mt-7 inline-flex min-h-11 items-center bg-accent px-5 py-3 text-sm font-bold text-paper hover:bg-accent-dark">Lihat detail dan episode →</Link>
            </div>
            <Link href={`/anime/${featured.slug}`} className="group relative mx-auto aspect-[3/4] w-full max-w-[27rem] overflow-hidden bg-paper-deep md:mx-0 md:justify-self-end">
              {featured.cover_url ? <Image src={featured.cover_url} alt={`Sampul ${featured.title}`} fill priority sizes="(max-width: 768px) 90vw, 432px" className="object-cover transition duration-500 group-hover:scale-[1.02]" /> : <div className="grid h-full place-items-center font-display text-6xl italic text-muted/40">LA</div>}
            </Link>
          </div>
        </section>
      ) : (
        <section className="editorial-grid border-b border-ink"><div className="shell py-16"><p className="eyebrow text-accent-dark">Layar Anime</p><h1 className="display-title page-title mt-4">Arsip tayangan anime.</h1></div></section>
      )}

      <div className="shell py-12 md:py-16">
        <DataNotice meta={response.meta} />
        <section>
          <SectionHeading label="Tayang sekarang" title="Anime berjalan" href="/anime?status=ongoing" />
          <AnimeGrid items={ongoing} />
        </section>
        <section className="mt-16 md:mt-20">
          <SectionHeading label="Arsip terbaru" title="Sudah tamat" href="/anime?status=complete" />
          <CompactAnimeList items={response.data.complete} />
        </section>
      </div>
    </>
  );
}
