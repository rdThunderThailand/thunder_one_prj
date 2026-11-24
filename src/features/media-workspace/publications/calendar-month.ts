import { shiftYmd, ymdDow } from "./schedule.ts";

/** Monday-first month cells; null pads the leading gap. */
export function monthCells(firstOfMonth: string): (string | null)[] {
  const cells: (string | null)[] = Array((ymdDow(firstOfMonth) + 6) % 7).fill(null);
  for (let ymd = firstOfMonth; ymd.slice(0, 7) === firstOfMonth.slice(0, 7); ymd = shiftYmd(ymd, 1)) cells.push(ymd);
  return cells;
}

export function addMonths(firstOfMonth: string, offset: number): string {
  const [year, month] = firstOfMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function selectDateRange(anchor: string | null, date: string) {
  return anchor === null
    ? { startDate: date, endDate: date, anchor: date }
    : { startDate: anchor < date ? anchor : date, endDate: anchor < date ? date : anchor, anchor: null };
}
