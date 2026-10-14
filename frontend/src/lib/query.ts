export function positivePage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function labelStatus(status?: string): string {
  return status?.toLowerCase() === "complete" ? "Tamat" : status?.toLowerCase() === "ongoing" ? "Berjalan" : status || "—";
}
