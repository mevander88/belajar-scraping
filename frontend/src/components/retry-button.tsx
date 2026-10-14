"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RetryButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
      className="inline-flex min-h-11 items-center bg-ink px-6 py-3 text-sm font-bold text-paper hover:bg-accent-dark disabled:cursor-wait disabled:opacity-60"
    >
      {isPending ? "Mencoba lagi…" : "Coba lagi"}
    </button>
  );
}
