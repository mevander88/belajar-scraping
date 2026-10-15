import { Icon, type IconName } from "./icon";

export function EmptyState({ title = "Belum ada data", description = "Konten untuk bagian ini belum tersedia.", icon = "inbox" }: { title?: string; description?: string; icon?: IconName }) {
  return <div className="border-y border-border px-5 py-10 text-center"><Icon name={icon} className="mx-auto size-7 text-muted" /><p className="mt-3 text-lg font-semibold text-foreground">{title}</p><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-secondary">{description}</p></div>;
}
