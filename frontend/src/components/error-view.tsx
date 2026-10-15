import Link from "next/link";
import { Icon } from "./icon";

function errorCopy(pathname: string) {
  if (pathname.startsWith("/episode/")) return {
    title: "Episode belum dapat dimuat.",
    description: "Informasi episode sementara tidak tersedia. Coba lagi atau pilih judul lain dari katalog.",
    href: "/katalog", link: "Buka katalog",
  };
  if (pathname.startsWith("/anime/")) return {
    title: "Detail anime belum dapat dimuat.",
    description: "Informasi dan daftar episode sementara tidak tersedia. Coba lagi atau pilih judul lain dari katalog.",
    href: "/katalog", link: "Buka katalog",
  };
  if (pathname === "/search") return {
    title: "Hasil pencarian belum dapat dimuat.",
    description: "Pencarian sementara tidak tersedia. Coba lagi atau masukkan kata kunci lain.",
    href: "/search", link: "Buka pencarian",
  };
  if (pathname.startsWith("/genres/")) return {
    title: "Daftar genre belum dapat dimuat.",
    description: "Daftar untuk genre ini sementara tidak tersedia. Coba lagi atau pilih genre lain.",
    href: "/genres", link: "Lihat genre",
  };
  return {
    title: "Halaman belum dapat dimuat.",
    description: "Konten sementara tidak tersedia. Coba lagi beberapa saat lagi.",
    href: "/", link: "Kembali ke beranda",
  };
}

export function ErrorView({ reset, pathname }: { reset: () => void; pathname: string }) {
  const copy = errorCopy(pathname);
  return (
    <section className="shell py-16 md:py-20" role="alert">
      <div className="max-w-2xl rounded-lg border border-error/40 bg-surface p-6 md:p-8">
        <Icon name="alert-circle" className="mb-4 size-8 text-error" />
        <p className="kicker text-error">Gangguan sementara</p>
        <h1 className="page-title mt-2">{copy.title}</h1>
        <p className="mt-3 max-w-xl leading-7 text-secondary">{copy.description}</p>
        <div className="mt-6 flex flex-wrap items-center gap-5">
          <button type="button" onClick={reset} className="button-primary inline-flex items-center justify-center gap-2"><Icon name="refresh" className="size-4" />Coba lagi</button>
          <Link href={copy.href} className="text-link inline-flex min-h-11 items-center gap-2 text-sm">{copy.link}<Icon name="arrow-right" className="size-4" /></Link>
        </div>
      </div>
    </section>
  );
}
