import Link from "next/link";
import { AnimeGrid } from "@/components/anime-grid";
import { DataNotice } from "@/components/data-notice";
import { SectionHeading } from "@/components/section-heading";
import { getHome, getReadiness } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [response, readiness] = await Promise.all([getHome(), getReadiness()]);
  const services = [
    ["API", readiness.api ? "Terhubung" : "Terputus", readiness.api],
    ["Database", readiness.data.database === "connected" ? "Siap" : "Tidak siap", readiness.data.database === "connected"],
    ["Cache", readiness.data.redis === "connected" ? "Siap" : "Terbatas", readiness.data.redis === "connected"],
  ] as const;
  return (
    <>
      <section className="shell grid min-h-[34rem] items-end gap-10 py-14 md:grid-cols-[1.4fr_.6fr] md:py-20">
        <div><p className="eyebrow mb-5 text-accent-dark">Edisi terbaru / Anime guide</p><h1 className="display-title max-w-5xl text-6xl text-balance sm:text-8xl lg:text-[8.5rem]">Temukan cerita untuk layar berikutnya.</h1></div>
        <div className="border-l border-ink pl-6"><p className="text-lg leading-8 text-muted">Jelajahi anime yang sedang berjalan, judul yang telah tamat, dan jadwal tayang dalam satu arsip yang mudah dibaca.</p><Link href="/anime?status=ongoing" className="mt-6 inline-block bg-accent px-5 py-3 text-sm font-bold text-paper hover:bg-accent-dark">Lihat anime ongoing →</Link></div>
      </section>
      <section className="border-y border-ink bg-ink text-paper" aria-label="Status layanan"><div className="shell grid sm:grid-cols-3">{services.map(([name, state, ready]) => <div key={name} className="flex items-center justify-between border-b border-paper/20 py-4 sm:border-b-0 sm:border-r sm:px-5 first:pl-0 last:border-0"><span className="eyebrow text-paper/60">{name}</span><span className="flex items-center gap-2 text-sm font-bold"><i className={`size-2 rounded-full ${ready ? "bg-success" : "bg-accent"}`} aria-hidden="true" />{state}</span></div>)}</div></section>
      <div className="shell py-16"><DataNotice meta={response.meta} /><section><SectionHeading index="01 / Sekarang" title="Sedang berjalan" href="/anime?status=ongoing" /><AnimeGrid items={response.data.ongoing} /></section><section className="mt-20"><SectionHeading index="02 / Arsip" title="Baru saja tamat" href="/anime?status=complete" /><AnimeGrid items={response.data.complete} /></section></div>
    </>
  );
}
