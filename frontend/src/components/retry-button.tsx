"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Icon } from "./icon";

export function RetryButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
      className="button-primary inline-flex items-center justify-center gap-2 disabled:cursor-wait"
    >
      <Icon name="refresh" className={`size-4 ${isPending ? "animate-spin" : ""}`} />{isPending ? "Mencoba lagi…" : "Coba lagi"}
    </button>
  );
}
