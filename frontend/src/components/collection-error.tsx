import Link from "next/link";
import { Icon } from "./icon";
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
    <section className="shell py-12 md:py-16" role="alert">
      <div className="max-w-2xl rounded-xl border border-error/40 bg-surface p-6 md:p-8">
        <Icon name="alert-circle" className="mb-4 size-8 text-error" />
        <p className="kicker text-error">Koleksi {label} belum tersedia</p>
        <h2 className="section-title mt-2">{copy.title}</h2>
        <p className="mt-3 max-w-xl leading-7 text-secondary">{copy.description}</p>
        <div className="mt-6 flex flex-wrap items-center gap-5">
          <RetryButton />
          <Link href="/" className="text-link inline-flex items-center gap-2 text-sm"><Icon name="home" className="size-4" />Kembali ke beranda</Link>
        </div>
      </div>
    </section>
  );
}
