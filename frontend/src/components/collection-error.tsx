import Link from "next/link";
import { RetryButton } from "./retry-button";

function errorCopy(status: number) {
  switch (status) {
    case 502:
      return {
        title: "Daftar dari sumber belum dapat diproses.",
        description: "Website sumber sedang bermasalah atau strukturnya berubah. Coba lagi beberapa saat lagi.",
      };
    case 504:
      return {
        title: "Website sumber terlalu lama merespons.",
        description: "Permintaan dihentikan agar Anda tidak menunggu terlalu lama. Silakan coba kembali.",
      };
    case 503:
      return {
        title: "Layanan data belum dapat dihubungi.",
        description: "Backend mungkin sedang dimulai ulang atau mengalami gangguan sementara.",
      };
    default:
      return {
        title: "Daftar anime belum dapat dimuat.",
        description: "Terjadi gangguan sementara saat mengambil data.",
      };
  }
}

export function CollectionError({ status, label }: { status: number; label: string }) {
  const copy = errorCopy(status);
  return (
    <section className="shell py-16" role="alert">
      <div className="max-w-2xl border-y border-ink py-8">
        <p className="eyebrow text-accent-dark">Koleksi {label} belum tersedia</p>
        <h2 className="mt-3 font-display text-4xl">{copy.title}</h2>
        <p className="mt-4 max-w-xl leading-7 text-muted">{copy.description}</p>
        <div className="mt-7 flex flex-wrap items-center gap-5">
          <RetryButton />
          <Link href="/" className="link-line text-sm font-bold">Kembali ke beranda</Link>
        </div>
      </div>
    </section>
  );
}
