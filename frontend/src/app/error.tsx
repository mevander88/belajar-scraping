"use client";
import { usePathname } from "next/navigation";
import { ErrorView } from "@/components/error-view";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const pathname = usePathname();
  return <ErrorView reset={reset} pathname={pathname} />;
}
