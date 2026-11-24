import { readChannelScope, writeChannelScope, type ChannelScope } from "../channels/channel-scope.ts";
import { todayYmd } from "./calendar-day.ts";

export type CalendarUrlState = { date: string; scope: ChannelScope };

const isValidYmd = (value: string | null): value is string => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value;
};

/** `?date=YYYY-MM-DD` (missing or invalid → today) plus the shared Channel scope. */
export function readCalendarUrl(params: URLSearchParams, today: string = todayYmd()): CalendarUrlState {
  const date = params.get("date");
  return { date: isValidYmd(date) ? date : today, scope: readChannelScope(params) };
}

/** Today's date is left out of the URL so the bare route always means "today". */
export function writeCalendarUrl(state: CalendarUrlState, today: string = todayYmd()): URLSearchParams {
  const params = writeChannelScope(state.scope, new URLSearchParams());
  if (state.date !== today) params.set("date", state.date);
  return params;
}
