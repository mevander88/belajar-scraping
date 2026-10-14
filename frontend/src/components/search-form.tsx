export function SearchForm({ defaultValue = "", compact = false }: { defaultValue?: string; compact?: boolean }) {
  return (
    <form action="/search" method="get" role="search" className={`flex w-full ${compact ? "lg:w-auto" : "max-w-2xl"}`}>
      <label htmlFor={compact ? "site-search" : "result-search"} className="sr-only">Cari judul anime</label>
      <input
        id={compact ? "site-search" : "result-search"}
        name="query"
        type="search"
        defaultValue={defaultValue}
        required
        autoComplete="off"
        placeholder="Cari judul anime"
        className={`min-h-11 min-w-0 flex-1 border border-ink bg-paper px-3 text-sm placeholder:text-muted ${compact ? "lg:w-40 xl:w-52" : "sm:min-h-12 sm:px-4"}`}
      />
      <button type="submit" className={`min-h-11 shrink-0 bg-ink px-4 text-sm font-bold text-paper hover:bg-accent-dark ${compact ? "" : "sm:min-h-12 sm:px-6"}`}>
        Cari
      </button>
    </form>
  );
}
