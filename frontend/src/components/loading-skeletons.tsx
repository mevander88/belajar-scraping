function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-elevated ${className}`} />;
}

function LoadingStatus({ label }: { label: string }) {
  return <span className="sr-only">{label}</span>;
}

export function PageHeadingSkeleton() {
  return (
    <header className="border-b border-border bg-surface" aria-hidden="true">
      <div className="shell py-8 md:py-10">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-3 h-9 w-full max-w-xl" />
        <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
      </div>
    </header>
  );
}

export function AnimeGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-5" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <Skeleton className="aspect-[3/4] w-full rounded-xl border border-border" />
          <Skeleton className="mt-3 h-4 w-11/12" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function CollectionLoading() {
  return (
    <div role="status" aria-live="polite">
      <PageHeadingSkeleton />
      <div className="shell py-10 md:py-12"><AnimeGridSkeleton /></div>
      <LoadingStatus label="Memuat daftar anime" />
    </div>
  );
}

export function HomeLoading() {
  return (
    <div role="status" aria-live="polite">
      <section className="-mt-18 min-h-[32rem] border-b border-border bg-surface md:min-h-0" aria-hidden="true">
        <div className="shell grid min-h-[32rem] content-center gap-8 pb-8 pt-26 md:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center lg:gap-14 lg:pb-10 lg:pt-28">
          <div>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-4 h-12 w-full max-w-2xl" />
            <Skeleton className="mt-4 h-4 w-3/5" />
            <Skeleton className="mt-4 h-20 w-full max-w-2xl" />
            <Skeleton className="mt-6 h-11 w-52" />
          </div>
          <Skeleton className="mx-auto hidden aspect-[3/4] w-full max-w-[22rem] rounded-xl border border-border md:block lg:mx-0 lg:justify-self-end" />
        </div>
      </section>
      <div className="shell py-10 md:py-12" aria-hidden="true">
        <Skeleton className="mb-5 h-7 w-52" />
        <AnimeGridSkeleton count={5} />
      </div>
      <LoadingStatus label="Memuat halaman utama" />
    </div>
  );
}

export function AnimeDetailLoading() {
  return (
    <div className="shell py-8 md:py-10" role="status" aria-live="polite">
      <header className="anime-detail-header border-b border-border pb-8 md:pb-10" aria-hidden="true">
        <Skeleton className="anime-detail-cover mx-auto aspect-[3/4] w-full max-w-xs rounded-xl border border-border lg:mx-0 lg:max-w-none" />
        <div className="anime-detail-intro">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-3 h-12 w-full max-w-2xl" />
          <Skeleton className="mt-4 h-4 w-2/3" />
        </div>
        <div className="anime-detail-facts grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-16 rounded-none bg-surface" />)}
        </div>
      </header>
      <div className="grid gap-10 py-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-12 lg:py-10" aria-hidden="true">
        <div><Skeleton className="h-6 w-36" /><Skeleton className="mt-4 h-32 w-full" /></div>
        <div><Skeleton className="h-6 w-44" /><Skeleton className="mt-4 h-64 w-full rounded-xl border border-border" /></div>
      </div>
      <LoadingStatus label="Memuat detail anime" />
    </div>
  );
}

export function EpisodeLoading() {
  return (
    <div className="shell py-8 md:py-10" role="status" aria-live="polite">
      <header className="mb-6 border-b border-border pb-5 md:mb-8 md:pb-6" aria-hidden="true">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-3 h-9 w-full max-w-3xl" />
      </header>
      <Skeleton className="mb-4 h-28 w-full rounded-xl border border-border" />
      <Skeleton className="aspect-video w-full rounded-xl border border-border bg-black" />
      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-12" aria-hidden="true">
        <div><Skeleton className="h-6 w-40" /><Skeleton className="mt-4 h-64 w-full rounded-xl border border-border" /></div>
        <div><Skeleton className="h-6 w-36" /><Skeleton className="mt-4 h-64 w-full rounded-xl border border-border" /></div>
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
          {Array.from({ length: 12 }, (_, index) => <Skeleton key={index} className="h-20 w-full rounded-xl border border-border" />)}
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
      <div className="shell py-10 md:py-12" aria-hidden="true">
        <Skeleton className="h-11 w-full max-w-2xl" />
        <div className="mt-12"><AnimeGridSkeleton /></div>
      </div>
      <LoadingStatus label="Mencari anime" />
    </div>
  );
}
