export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="shell py-7 md:py-8">
        <p className="kicker mb-2">{eyebrow}</p>
        <h1 className="page-title text-balance">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-6 text-secondary md:text-base">{description}</p>}
      </div>
    </header>
  );
}
