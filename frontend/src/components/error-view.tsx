import { Icon } from "./icon";

export function ErrorView({ reset }: { reset: () => void }) {
  return (
    <section className="shell py-16 md:py-20" role="alert">
      <div className="max-w-2xl rounded-xl border border-error/40 bg-surface p-6 md:p-8">
        <Icon name="alert-circle" className="mb-4 size-8 text-error" />
        <p className="kicker text-error">Gangguan sementara</p>
        <h1 className="page-title mt-2">Halaman belum dapat dimuat.</h1>
        <p className="mt-3 max-w-xl leading-7 text-secondary">Sumber data mungkin sedang tidak tersedia. Coba kembali beberapa saat lagi.</p>
        <button type="button" onClick={reset} className="button-primary mt-6 inline-flex items-center justify-center gap-2"><Icon name="refresh" className="size-4" />Coba lagi</button>
      </div>
    </section>
  );
}
