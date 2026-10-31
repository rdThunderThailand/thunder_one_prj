export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Coverage includes the start day. A leap-day anniversary rolls to March 1 before subtracting a day. */
export function warrantyEndDate(start: string, years: string): string {
  if (!isCalendarDate(start) || !/^\d+$/.test(years)) return "";
  const duration = Number(years);
  if (!Number.isSafeInteger(duration) || duration < 1) return "";
  const date = new Date(`${start}T00:00:00Z`);
  if (date.getUTCFullYear() + duration > 9999) return "";
  date.setUTCFullYear(date.getUTCFullYear() + duration);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
