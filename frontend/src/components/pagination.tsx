import Link from "next/link";
import { Icon } from "./icon";

function hrefFor(basePath: string, page: number, params?: Record<string, string>) {
  const query = new URLSearchParams(params);
  if (page > 1) query.set("page", String(page));
  return `${basePath}${query.size ? `?${query}` : ""}`;
}

export function Pagination({ current, last, basePath, params }: { current: number; last: number; basePath: string; params?: Record<string, string> }) {
  if (last <= 1) return null;
  const pages = Array.from(new Set([1, current - 1, current, current + 1, last])).filter((page) => page >= 1 && page <= last).sort((a, b) => a - b);
  return (
    <nav aria-label="Paginasi" className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
      {current > 1 ? <Link className="button-secondary inline-flex items-center justify-center gap-2" href={hrefFor(basePath, current - 1, params)}><Icon name="arrow-left" className="size-4" />Sebelumnya</Link> : <span />}
      <div className="flex items-center gap-2">{pages.map((page, index) => <span key={page} className="flex items-center gap-2">{index > 0 && page - pages[index - 1] > 1 && <span className="text-muted" aria-hidden="true">…</span>}<Link href={hrefFor(basePath, page, params)} aria-current={page === current ? "page" : undefined} className={`grid size-11 place-items-center rounded-lg border text-sm font-bold transition-colors ${page === current ? "border-primary bg-primary text-foreground" : "border-border bg-surface text-secondary hover:bg-hover hover:text-foreground"}`}>{page}</Link></span>)}</div>
      {current < last ? <Link className="button-secondary inline-flex items-center justify-center gap-2" href={hrefFor(basePath, current + 1, params)}>Berikutnya<Icon name="arrow-right" className="size-4" /></Link> : <span />}
    </nav>
  );
}
