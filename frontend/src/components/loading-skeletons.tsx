function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-elevated ${className}`} />;
}

function LoadingStatus({ label }: { label: string }) {
  return <span className="sr-only">{label}</span>;
}

export function PageHeadingSkeleton() {
  return (
    <header className="border-b border-border bg-surface" aria-hidden="true">
      <div className="shell py-7 md:py-8">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-3 h-9 w-full max-w-xl" />
        <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
      </div>
    </header>
  );
}

export function AnimeGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-5" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-border/70 bg-surface">
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="p-3 sm:p-3.5"><Skeleton className="h-3 w-1/2" /><Skeleton className="mt-2 h-4 w-11/12" /><Skeleton className="mt-2 h-3 w-2/3" /></div>
        </div>
      ))}
    </div>
  );
}

export function CollectionLoading() {
  return (
    <div role="status" aria-live="polite">
      <PageHeadingSkeleton />
      <div className="shell py-8 md:py-10"><AnimeGridSkeleton /></div>
      <LoadingStatus label="Memuat daftar anime" />
    </div>
  );
}

export function HomeLoading() {
  return (
    <div role="status" aria-live="polite">
      <section className="-mt-18 min-h-[32rem] bg-surface md:min-h-0" aria-hidden="true">
        <div className="shell grid min-h-[32rem] content-center gap-8 pb-8 pt-26 md:min-h-0 md:grid-cols-[minmax(0,1fr)_minmax(14rem,17rem)] md:items-center lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:gap-14 lg:pb-10 lg:pt-28">
          <div>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-4 h-12 w-full max-w-2xl" />
            <Skeleton className="mt-4 h-4 w-3/5" />
            <Skeleton className="mt-4 h-20 w-full max-w-2xl" />
            <Skeleton className="mt-6 h-11 w-52" />
          </div>
          <Skeleton className="mx-auto hidden aspect-[3/4] w-full max-w-[22rem] rounded-lg md:mx-0 md:block md:max-w-[17rem] md:justify-self-end lg:max-w-[22rem]" />
        </div>
      </section>
      <div className="shell py-8 md:py-10" aria-hidden="true">
        <Skeleton className="mb-5 h-7 w-52" />
        <AnimeGridSkeleton count={5} />
      </div>
      <LoadingStatus label="Memuat halaman utama" />
    </div>
  );
}

export function AnimeDetailLoading() {
  return (
    <div className="shell py-7 md:py-9" role="status" aria-live="polite">
      <header className="anime-detail-header border-b border-border pb-7 md:pb-9" aria-hidden="true">
        <Skeleton className="anime-detail-cover mx-auto aspect-[3/4] w-full max-w-[17rem] rounded-lg border border-border/70 sm:max-w-xs lg:mx-0 lg:max-w-none" />
        <div className="anime-detail-intro">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-12 w-full max-w-2xl" />
          <Skeleton className="mt-4 h-4 w-2/3" />
          <Skeleton className="mt-5 h-11 w-48" />
        </div>
        <div className="anime-detail-facts grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4 lg:gap-x-6">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="border-t border-border pt-2.5"><Skeleton className="h-3 w-16" /><Skeleton className="mt-2 h-5 w-24 max-w-full" /></div>)}
        </div>
      </header>
      <div className="grid gap-8 py-7 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-12 lg:py-9" aria-hidden="true">
        <div><Skeleton className="h-6 w-36" /><Skeleton className="mt-4 h-32 w-full" /></div>
        <div><Skeleton className="h-6 w-44" /><Skeleton className="mt-4 h-64 w-full rounded-none border-y border-border" /></div>
      </div>
      <LoadingStatus label="Memuat detail anime" />
    </div>
  );
}

export function EpisodeLoading() {
  return (
    <div className="shell py-7 md:py-9" role="status" aria-live="polite">
      <header className="mb-4 border-b border-border pb-4 md:mb-6 md:pb-5" aria-hidden="true">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-9 w-full max-w-3xl" />
      </header>
      <Skeleton className="mb-3 h-16 w-full rounded-none border-b border-border" />
      <Skeleton className="aspect-video w-full rounded-lg border border-border bg-black" />
      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-12" aria-hidden="true">
        <div><Skeleton className="h-6 w-40" /><Skeleton className="mt-4 h-64 w-full rounded-none border-y border-border" /></div>
        <div><Skeleton className="h-6 w-36" /><Skeleton className="mt-4 h-64 w-full rounded-lg border border-border" /></div>
      </div>
      <LoadingStatus label="Memuat episode dan pemutar video" />
    </div>
  );
}

export function DirectoryLoading({ label = "Memuat data" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite">
      <PageHeadingSkeleton />
      <div className="shell py-8 md:py-10" aria-hidden="true">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }, (_, index) => <Skeleton key={index} className="h-20 w-full rounded-lg border border-border" />)}
        </div>
      </div>
      <LoadingStatus label={label} />
    </div>
  );
}

export function SearchLoading() {
  return (
    <div role="status" aria-live="polite">
      <PageHeadingSkeleton />
      <div className="shell py-8 md:py-10" aria-hidden="true">
        <Skeleton className="h-11 w-full max-w-2xl" />
        <div className="mt-8"><AnimeGridSkeleton /></div>
      </div>
      <LoadingStatus label="Mencari anime" />
    </div>
  );
}
