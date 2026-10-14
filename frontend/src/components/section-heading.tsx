import Link from "next/link";

export function SectionHeading({ label, title, href, linkLabel = "Lihat semua" }: { label: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-7 flex items-end justify-between gap-5 border-b border-ink pb-4">
      <div><p className="eyebrow mb-2 text-accent-dark">{label}</p><h2 className="font-display section-title tracking-tight">{title}</h2></div>
      {href && <Link href={href} className="link-line shrink-0 text-sm font-bold">{linkLabel} →</Link>}
    </div>
  );
}
