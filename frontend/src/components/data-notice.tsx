import type { Meta } from "@/lib/types";

export function DataNotice({ meta }: { meta: Meta }) {
  if (meta.cache !== "stale") return null;
  return (
    <aside className="mb-8 flex flex-col gap-1 border-y border-rule py-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Informasi data">
      <p className="text-sm font-bold">Menampilkan salinan data terakhir</p>
      <p className="text-sm text-muted">Sumber terbaru sedang tidak dapat diakses.</p>
    </aside>
  );
}
