export function ErrorView({ reset }: { reset: () => void }) {
  return (
    <section className="shell py-24 text-center">
      <p className="eyebrow text-accent-dark">Gangguan sementara</p>
      <h1 className="display-title mt-4 text-5xl sm:text-7xl">Halaman belum dapat dimuat.</h1>
      <p className="mx-auto mt-5 max-w-xl leading-7 text-muted">Sumber data mungkin sedang tidak tersedia. Coba kembali beberapa saat lagi.</p>
      <button type="button" onClick={reset} className="mt-8 bg-ink px-6 py-3 text-sm font-bold text-paper hover:bg-accent-dark">Coba lagi</button>
    </section>
  );
}
