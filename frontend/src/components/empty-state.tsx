export function EmptyState({ title = "Belum ada data", description = "Konten untuk bagian ini belum tersedia." }: { title?: string; description?: string }) {
  return <div className="border-y border-rule py-12 text-center"><p className="font-display text-3xl italic">{title}</p><p className="mt-2 text-sm text-muted">{description}</p></div>;
}
