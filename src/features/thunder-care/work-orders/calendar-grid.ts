// Shared static grid data — used by both MiniCalendar (compact, non-interactive
// preview on My Work) and CalendarPage (full, interactive). Hardcoded to
// August with day 11 as "today" to match the requirement doc's mockup
// ("Tuesday, 11 August") — TODAY_DAY here must stay in sync with mock-data.ts's
// TODAY_DATE ("2026-08-11").
export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export const WEEKS: (number | null)[][] = [
  [null, null, null, null, null, 1, 2],
  [3, 4, 5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14, 15, 16],
  [17, 18, 19, 20, 21, 22, 23],
  [24, 25, 26, 27, 28, 29, 30],
  [31, null, null, null, null, null, null],
];

export const TODAY_DAY = 11;
