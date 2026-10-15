import type { Meta } from "@/lib/types";
import { Icon } from "./icon";

export function DataNotice({ meta }: { meta: Meta }) {
  if (meta.cache !== "stale") return null;
  return (
    <aside className="mb-8 flex flex-col gap-1 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5" aria-label="Informasi data">
      <p className="flex items-center gap-2 text-sm font-bold text-warning"><Icon name="alert-triangle" className="size-4 shrink-0" />Menampilkan salinan data terakhir</p>
      <p className="text-sm text-secondary">Sumber terbaru sedang tidak dapat diakses.</p>
    </aside>
  );
}
