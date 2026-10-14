import Link from "next/link";

function hrefFor(basePath: string, page: number, params?: Record<string, string>) {
  const query = new URLSearchParams(params);
  if (page > 1) query.set("page", String(page));
  return `${basePath}${query.size ? `?${query}` : ""}`;
}

export function Pagination({ current, last, basePath, params }: { current: number; last: number; basePath: string; params?: Record<string, string> }) {
  if (last <= 1) return null;
  const pages = Array.from(new Set([1, current - 1, current, current + 1, last])).filter((page) => page >= 1 && page <= last).sort((a, b) => a - b);
  return (
    <nav aria-label="Paginasi" className="mt-14 flex flex-wrap items-center justify-between gap-4 border-y border-ink py-4">
      {current > 1 ? <Link className="eyebrow hover:text-accent-dark" href={hrefFor(basePath, current - 1, params)}>← Sebelumnya</Link> : <span />}
      <div className="flex items-center gap-2">{pages.map((page, index) => <span key={page} className="flex items-center gap-2">{index > 0 && page - pages[index - 1] > 1 && <span aria-hidden="true">…</span>}<Link href={hrefFor(basePath, page, params)} aria-current={page === current ? "page" : undefined} className={`grid size-9 place-items-center text-sm font-bold ${page === current ? "bg-ink text-paper" : "border border-rule hover:border-ink"}`}>{page}</Link></span>)}</div>
      {current < last ? <Link className="eyebrow hover:text-accent-dark" href={hrefFor(basePath, current + 1, params)}>Berikutnya →</Link> : <span />}
    </nav>
  );
}
