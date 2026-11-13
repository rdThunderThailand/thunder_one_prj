// Asset Profile display rules (05 §4.2: what it is, where it is, who is responsible, status, history).

/** "Head Office › Main Building › Lobby 1"; falls back to the asset's own location before Core sends the path. */
export function locationTrail(path: { name: string | null }[], location: { name: string | null } | null): string {
  const names = (path.length ? path : location ? [location] : []).map((item) => item.name?.trim() || "Unnamed location");
  return names.join(" › ");
}

/** Days a warranty counts as "ending soon": the same 30-day window as the Overview attention list. */
export const WARRANTY_SOON_DAYS = 30;
export type WarrantyState = { tone: "green" | "yellow" | "zinc"; label: string };

/** Coverage state from the end date alone; `today` is a YYYY-MM-DD calendar date. No end date reads as open-ended. */
export function warrantyState(endDate: string | null, today: string): WarrantyState {
  if (!endDate) return { tone: "green", label: "No end date" };
  const days = Math.round((Date.parse(`${endDate.slice(0, 10)}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  if (!Number.isFinite(days)) return { tone: "zinc", label: "End date unknown" };
  if (days < 0) return { tone: "zinc", label: "Expired" };
  if (days === 0) return { tone: "yellow", label: "Ends today" };
  if (days <= WARRANTY_SOON_DAYS) return { tone: "yellow", label: `Ends in ${days} ${days === 1 ? "day" : "days"}` };
  return { tone: "green", label: "Active" };
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
