import type { Meta } from "@/lib/types";

export function DataNotice({ meta }: { meta: Meta }) {
  if (meta.cache !== "stale" && !meta.warnings?.length) return null;
  return (
    <aside className="mb-8 border-l-4 border-accent bg-paper-deep px-5 py-4" aria-label="Informasi data">
      <p className="eyebrow text-accent-dark">Catatan data</p>
      <p className="mt-1 text-sm leading-6 text-muted">{meta.warnings?.join(" ") || "Data tersimpan sebelumnya sedang ditampilkan."}</p>
    </aside>
  );
}
