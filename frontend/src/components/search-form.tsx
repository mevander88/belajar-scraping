"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icon";

type Props = { defaultValue?: string; compact?: boolean; overlay?: boolean };

export function SearchForm({ defaultValue = "", compact = false, overlay = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!compact || !expanded) return;
    inputRef.current?.focus();

    const closeFromOutside = (event: PointerEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) setExpanded(false);
    };
    document.addEventListener("pointerdown", closeFromOutside);
    return () => document.removeEventListener("pointerdown", closeFromOutside);
  }, [compact, expanded]);

  if (compact) {
    const overlayControl = overlay
      ? "text-white/65 hover:text-white"
      : "text-primary hover:text-focus";

    return (
      <>
        <form action="/search" method="get" role="search" className="relative flex w-full min-w-0 lg:hidden">
          <label htmlFor="mobile-site-search" className="sr-only">Cari judul anime</label>
          <input
            id="mobile-site-search"
            name="query"
            type="search"
            defaultValue={defaultValue}
            required
            autoComplete="off"
            placeholder="Cari anime…"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-canvas px-3 pr-12 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-focus"
          />
          <button type="submit" aria-label="Cari anime" className="absolute right-1 top-1 grid size-9 cursor-pointer place-items-center rounded-md text-primary transition-colors hover:text-focus focus-visible:outline-offset-1">
            <Icon name="search" className="size-4.5" />
          </button>
        </form>

        <form
          ref={formRef}
          action="/search"
          method="get"
          role="search"
          onKeyDown={(event) => { if (event.key === "Escape") { setExpanded(false); requestAnimationFrame(() => triggerRef.current?.focus()); } }}
          className={`relative hidden min-w-0 transition-[width] duration-200 lg:flex ${expanded ? "lg:w-52" : "lg:w-11"}`}
        >
          {expanded ? (
            <>
              <label htmlFor="site-search" className="sr-only">Cari judul anime</label>
              <input
                ref={inputRef}
                id="site-search"
                name="query"
                type="search"
                defaultValue={defaultValue}
                required
                autoComplete="off"
                placeholder="Cari anime…"
                className={`min-h-11 min-w-0 flex-1 rounded-lg border px-3 pr-12 text-sm outline-none transition-colors focus:border-focus ${overlay ? "border-white/20 bg-black/20 text-white/85 placeholder:text-white/45" : "border-border bg-canvas text-foreground placeholder:text-muted"}`}
              />
              <button type="submit" aria-label="Cari anime" className={`absolute right-1 top-1 grid size-9 cursor-pointer place-items-center rounded-md transition-colors focus-visible:outline-offset-1 ${overlay ? "text-white/65 hover:text-white" : "text-primary hover:text-focus"}`}>
                <Icon name="search" className="size-4.5" />
              </button>
            </>
          ) : (
            <button
              ref={triggerRef}
              type="button"
              aria-label="Buka pencarian"
              aria-expanded="false"
              aria-controls="site-search"
              onClick={() => setExpanded(true)}
              className={`grid size-11 cursor-pointer place-items-center rounded-md transition-colors ${overlayControl}`}
            >
              <Icon name="search" className="size-5" />
            </button>
          )}
        </form>
      </>
    );
  }

  return (
    <form action="/search" method="get" role="search" className="relative flex w-full min-w-0 max-w-2xl">
      <label htmlFor="result-search" className="sr-only">Cari judul anime</label>
      <input
        id="result-search"
        name="query"
        type="search"
        defaultValue={defaultValue}
        required
        autoComplete="off"
        placeholder="Cari judul anime"
        className="min-h-11 min-w-0 flex-1 rounded-l-lg border border-r-0 border-border bg-canvas px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-focus sm:px-4"
      />
      <button type="submit" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-r-lg border border-primary bg-primary px-4 text-sm font-bold text-foreground transition-colors hover:border-primary-hover hover:bg-primary-hover sm:px-6">
        <Icon name="search" className="size-4" />Cari
      </button>
    </form>
  );
}
