import Link from "next/link";
import { Icon } from "./icon";

export function SectionHeading({ label, title, href, linkLabel = "Lihat semua" }: { label: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-5 border-b border-border pb-3">
      <div><p className="kicker mb-1.5">{label}</p><h2 className="section-title">{title}</h2></div>
      {href && <Link href={href} className="text-link inline-flex shrink-0 items-center gap-1.5 text-sm">{linkLabel}<Icon name="arrow-right" className="size-4" /></Link>}
    </div>
  );
}
