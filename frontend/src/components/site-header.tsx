"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SearchForm } from "./search-form";

const links = [
  ["/", "Beranda"], ["/anime?status=ongoing", "Berjalan"],
  ["/anime?status=complete", "Tamat"], ["/jadwal", "Jadwal"],
  ["/genres", "Genre"], ["/katalog", "Katalog"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-ink bg-paper/95">
      <div className="shell flex min-h-20 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid size-10 place-items-center bg-ink font-display text-xl italic text-paper">LA</span>
          <span><strong className="block font-display text-xl leading-none">Layar Anime</strong><small className="eyebrow text-accent-dark">Arsip tayangan</small></span>
        </Link>
        <button type="button" className="eyebrow min-h-11 border border-ink px-3 py-2 lg:hidden" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}>{open ? "Tutup" : "Menu"}</button>
        <nav id="main-navigation" aria-label="Navigasi utama" className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-20 z-40 flex-col gap-3 border-b border-ink bg-paper px-4 py-4 lg:static lg:flex lg:flex-row lg:items-center lg:gap-1 lg:border-0 lg:bg-transparent lg:p-0`}>
          <div className="flex flex-col lg:flex-row">
            {links.map(([href, label]) => {
              const base = href.split("?")[0];
              const active = base === "/" ? pathname === "/" : pathname.startsWith(base);
              return <Link key={href} href={href} onClick={() => setOpen(false)} className={`eyebrow flex min-h-11 items-center border-b border-rule px-3 py-3 lg:border-0 ${active ? "text-accent-dark" : "hover:text-accent-dark"}`}>{label}</Link>;
            })}
          </div>
          <SearchForm compact />
        </nav>
      </div>
    </header>
  );
}
