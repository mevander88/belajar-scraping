export function PageHeading({ index, eyebrow, title, description }: { index: string; eyebrow: string; title: string; description?: string }) {
  return (
    <header className="shell grid gap-5 border-b border-ink py-12 md:grid-cols-[7rem_1fr] md:py-16">
      <span className="eyebrow text-accent-dark">{index}</span>
      <div><p className="eyebrow mb-3 text-muted">{eyebrow}</p><h1 className="display-title max-w-5xl text-5xl text-balance sm:text-7xl lg:text-8xl">{title}</h1>{description && <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">{description}</p>}</div>
    </header>
  );
}
