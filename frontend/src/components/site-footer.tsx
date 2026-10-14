import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-ink bg-ink text-paper">
      <div className="shell grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-end">
        <div><p className="font-display text-3xl italic">Layar Anime</p><p className="mt-2 max-w-md text-sm text-paper/70">Katalog ringkas untuk menemukan tayangan dan episode dari sumber yang tersedia.</p></div>
        <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold"><Link href="/jadwal">Jadwal</Link><Link href="/genres">Genre</Link><Link href="/katalog">Katalog A–Z</Link></nav>
      </div>
    </footer>
  );
}
