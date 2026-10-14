"use server";

import { ApiError, getStream } from "@/lib/api";
import type { MediaStream } from "@/lib/types";

export async function resolveStream(slug: string, serverID: string): Promise<{ stream?: MediaStream; error?: string }> {
  try {
    return { stream: await getStream(slug, serverID) };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    return { error: "Video belum dapat dimuat. Coba server lain." };
  }
}
