import Link from "next/link";

export function SectionHeading({ index, title, href, linkLabel = "Lihat semua" }: { index: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-5 border-b border-ink pb-4">
      <div><p className="eyebrow mb-2 text-accent-dark">{index}</p><h2 className="font-display text-4xl tracking-tight sm:text-5xl">{title}</h2></div>
      {href && <Link href={href} className="link-line shrink-0 text-sm font-bold">{linkLabel} →</Link>}
    </div>
  );
}
