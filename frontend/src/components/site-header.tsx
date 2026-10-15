"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Icon, type IconName } from "./icon";
import { SearchForm } from "./search-form";

const links = [
  ["/", "Beranda", "home"], ["/anime?status=ongoing", "Berjalan", "play-circle"],
  ["/anime?status=complete", "Tamat", "check-circle"], ["/jadwal", "Jadwal", "calendar"],
  ["/genres", "Genre", "tags"], ["/katalog", "Katalog", "library"],
] as const satisfies ReadonlyArray<readonly [string, string, IconName]>;

function NavigationLinks({ onNavigate, overlay }: { onNavigate: () => void; overlay: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "ongoing";

  return links.map(([href, label, icon]) => {
    const [base, query] = href.split("?");
    const expectedStatus = query ? new URLSearchParams(query).get("status") : null;
    const active = expectedStatus
      ? pathname === base && currentStatus === expectedStatus
      : base === "/" ? pathname === "/" : pathname.startsWith(base);
    const linkTone = overlay
      ? active
        ? "text-white after:bg-white"
        : "text-white/80 after:bg-white/60 hover:text-white hover:after:scale-x-100"
      : active
        ? "text-foreground after:bg-primary"
        : "text-secondary after:bg-muted hover:text-foreground hover:after:scale-x-100";
    const iconTone = overlay ? "text-white/80" : active ? "text-focus" : "text-muted";
    return (
      <Link
        key={href}
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`relative flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold transition-colors after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:scale-x-0 after:rounded-full after:transition-transform ${active ? "after:scale-x-100" : ""} ${linkTone}`}
      >
        <Icon name={icon} className={`mr-2 size-4 shrink-0 transition-colors ${iconTone}`} />
        {label}
      </Link>
    );
  });
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const overlay = pathname === "/" && !scrolled && !open;

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 12);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, [pathname]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-200 ${overlay ? "border-transparent bg-transparent" : "border-border bg-surface"}`}>
      <div className="shell flex min-h-18 items-center justify-between gap-4 py-3">
        <Link href="/" aria-label="Layar Anime — Beranda" onClick={() => setOpen(false)}>
          <span className="grid size-10 place-items-center"><Image src="/images/brand/layar-anime-icon.png" alt="" width={30} height={30} priority className={`size-7 object-contain transition-[filter,opacity] duration-200 ${overlay ? "grayscale brightness-150 opacity-80" : "opacity-100"}`} /></span>
        </Link>
        <button type="button" className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors lg:hidden ${overlay ? "border-white/25 bg-black/20 text-white/90 hover:bg-black/30 hover:text-white" : "border-border bg-elevated text-foreground hover:bg-hover"}`} aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} className={`size-4 transition-colors ${overlay ? "text-white/85" : "text-secondary"}`} />{open ? "Tutup" : "Menu"}</button>
        <nav id="main-navigation" aria-label="Navigasi utama" className={`${open ? "flex" : "hidden"} absolute inset-x-0 top-full z-40 flex-col gap-3 border-b border-border bg-elevated px-4 py-4 shadow-md shadow-black/20 lg:static lg:flex lg:flex-row lg:items-center lg:gap-2 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}>
          <div className="flex flex-col gap-1 lg:flex-row">
            <Suspense fallback={links.map(([href, label, icon]) => <Link key={href} href={href} className={`flex min-h-11 items-center rounded-md border border-transparent px-3 py-2 text-sm font-semibold ${overlay ? "text-white/80" : "text-secondary"}`}><Icon name={icon} className={`mr-2 size-4 shrink-0 ${overlay ? "text-white/80" : "text-muted"}`} />{label}</Link>)}>
              <NavigationLinks onNavigate={() => setOpen(false)} overlay={overlay} />
            </Suspense>
          </div>
          <SearchForm compact overlay={overlay} />
        </nav>
      </div>
    </header>
  );
}
