export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <header className="editorial-grid border-b border-ink">
      <div className="shell py-9 md:py-12">
        <p className="eyebrow mb-3 text-accent-dark">{eyebrow}</p>
        <h1 className="display-title page-title max-w-5xl text-balance">{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-base leading-7 text-muted md:text-lg">{description}</p>}
      </div>
    </header>
  );
}
