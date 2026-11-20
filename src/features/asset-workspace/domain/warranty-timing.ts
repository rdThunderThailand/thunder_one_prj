import { warrantyRemaining } from "./asset-profile-display.mts";

const DAY = 86_400_000;
const utc = (value: string) => Date.parse(`${value.slice(0, 10)}T00:00:00Z`);

/** Short hint under the End Date of Expiring Soon / Expired rows: "in 45 days", "Ends today", "3 days ago". */
export function warrantyEndHint(status: string, endDate: string | null, today: string) {
  if (!endDate || (status !== "Expiring Soon" && status !== "Expired")) return null;
  const days = Math.round((utc(endDate) - utc(today)) / DAY);
  if (!Number.isFinite(days)) return null;
  if (days === 0) return "Ends today";
  const count = `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  return days > 0 ? `in ${count}` : `${count} ago`;
}

/** Core counts a warranty by its End Date only, so one that starts later still reads Active. */
export function warrantyNotStarted(startDate: string | null, today: string) {
  return Boolean(startDate && startDate.slice(0, 10) > today);
}

/** "Starts in 1 year 1 month" for a warranty that has not started; null otherwise. */
export function warrantyStartsIn(startDate: string | null, today: string) {
  if (!warrantyNotStarted(startDate, today)) return null;
  const span = warrantyRemaining(startDate, today)?.replace(/ remaining$/, "") ?? "";
  return `Starts in ${span.charAt(0).toLowerCase()}${span.slice(1)}`;
}
