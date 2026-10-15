import Link from "next/link";
import Image from "next/image";
import { Icon } from "./icon";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-surface text-foreground">
      <div className="shell grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-end">
        <div><div className="flex items-center gap-3"><Image src="/images/brand/layar-anime-icon.png" alt="" width={32} height={32} className="size-8 object-contain" /><p className="text-lg font-bold">Layar Anime</p></div><p className="mt-2 max-w-md text-sm leading-6 text-secondary">Katalog ringkas untuk menemukan tayangan dan episode dari sumber yang tersedia.</p></div>
        <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-secondary"><Link className="inline-flex items-center gap-2 hover:text-focus" href="/jadwal"><Icon name="calendar" className="size-4" />Jadwal</Link><Link className="inline-flex items-center gap-2 hover:text-focus" href="/genres"><Icon name="tags" className="size-4" />Genre</Link><Link className="inline-flex items-center gap-2 hover:text-focus" href="/katalog"><Icon name="library" className="size-4" />Katalog A–Z</Link></nav>
      </div>
    </footer>
  );
}
