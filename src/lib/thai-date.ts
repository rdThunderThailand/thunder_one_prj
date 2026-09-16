const THAI_MONTHS_ABBR = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/** Formats an ISO "yyyy-mm-dd" date (e.g. from a native `<input type="date">`)
 *  as a Thai Buddhist-calendar label — "2026-07-01" → "1 ก.ค. 2569". Buddhist
 *  year = Gregorian year + 543, matching every hardcoded date label already
 *  used across features/people/**. */
export function formatThaiDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return `${day} ${THAI_MONTHS_ABBR[month - 1]} ${year + 543}`;
}

/** Days between an ISO "yyyy-mm-dd" date and today, in the same "อีก N วัน"
 *  wording every people/* mock row already uses. */
export function formatDaysUntilThai(isoDate: string): string {
  const target = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return "วันนี้";
  if (diffDays > 0) return `อีก ${diffDays} วัน`;
  return `ผ่านมาแล้ว ${Math.abs(diffDays)} วัน`;
}
