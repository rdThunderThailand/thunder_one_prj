"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { TIMEZONES, WEEKDAYS, formatMonthDays, shiftYmd, ymdDow } from "../../../schedule";
import { airsOn, upcomingDays, windowLabel, type ScheduleDraft } from "../../../schedule-preset";

const LIST_LIMIT = 10;
const DAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const at = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const mondayOf = (ymd: string) => shiftYmd(ymd, -((ymdDow(ymd) + 6) % 7));

function daysLine(draft: ScheduleDraft): { label: string; value: string } {
  if (draft.mode === "locked" && draft.locked) {
    const rec = draft.locked.schedule.recurrence;
    return "freq" in rec && rec.freq === "monthly"
      ? { label: "Monthly", value: formatMonthDays(rec.month_days) }
      : { label: "Continuous", value: "Plays the whole range, day and night" };
  }
  if (draft.mode === "one-time") return { label: "Date", value: draft.startDate ? DAY.format(at(draft.startDate)) : "—" };
  if (draft.mode === "dates") {
    const count = draft.dates.length;
    return { label: "Dates", value: `${count} date${count === 1 ? "" : "s"}: ${draft.dates.map((d) => SHORT.format(at(d))).join(", ")}` };
  }
  const labels = WEEKDAYS.filter((d) => draft.days.includes(d.value)).map((d) => d.label);
  const range = `${draft.startDate ? SHORT.format(at(draft.startDate)) : "—"} → ${draft.endDate ? SHORT.format(at(draft.endDate)) : "no end date"}`;
  return { label: "Days", value: `${labels.join(", ")} (${labels.length} days/week) · ${range}` };
}

/** Frames 08-12 right column: upcoming airings as a list or a week grid, and the summary. */
export function SchedulePreviewPane({ draft, today, programName }: { draft: ScheduleDraft; today: string; programName: string }) {
  const [view, setView] = useState<"list" | "week">("list");
  const [weekOf, setWeekOf] = useState(() => mondayOf(upcomingDays(draft, today, 1)[0] ?? today));
  const daily = draft.allDay ? { start: "00:00", end: "24:00" } : { start: draft.dailyStart, end: draft.dailyEnd };
  const upcoming = upcomingDays(draft, today, LIST_LIMIT);
  const zone = TIMEZONES.find((z) => z.id === draft.timezone)?.label ?? draft.timezone;
  const days = daysLine(draft);
  const isContinuous = draft.locked?.kind === "continuous";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Schedule Preview</h3>
        <div className="flex rounded-md border border-border p-0.5 text-xs">
          {(["list", "week"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={view === v ? "rounded bg-primary/10 px-2 py-1 font-medium text-primary" : "px-2 py-1 text-muted-foreground"}
            >
              {v === "list" ? "List view" : "Week view"}
            </button>
          ))}
        </div>
      </div>

      {view === "list" && (
        <ul className="flex flex-col gap-1.5">
          {upcoming.map((ymd) => (
            <li
              key={ymd}
              className="flex items-center gap-3 text-xs"
            >
              <span className="w-28 shrink-0 text-muted-foreground">{DAY.format(at(ymd))}</span>
              <span className="shrink-0 rounded bg-muted px-2 py-1 text-foreground">
                {isContinuous ? "All day" : `${daily.start} – ${daily.end}`}
              </span>
              <span className="truncate rounded bg-primary/10 px-2 py-1 font-medium text-primary">{programName}</span>
            </li>
          ))}
          {upcoming.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">No upcoming airings.</li>}
        </ul>
      )}

      {view === "week" && (
        <div>
          <div className="mb-2 flex items-center justify-between text-xs">
            <button
              type="button"
              aria-label="Previous week"
              className="rounded p-1 text-muted-foreground hover:bg-muted"
              onClick={() => setWeekOf(shiftYmd(weekOf, -7))}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="font-medium text-foreground">
              {SHORT.format(at(weekOf))} – {SHORT.format(at(shiftYmd(weekOf, 6)))}
            </span>
            <button
              type="button"
              aria-label="Next week"
              className="rounded p-1 text-muted-foreground hover:bg-muted"
              onClick={() => setWeekOf(shiftYmd(weekOf, 7))}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, i) => shiftYmd(weekOf, i)).map((ymd) => {
              const isOn = airsOn(draft, ymd);
              const top = (minutes(daily.start) / 1440) * 100;
              const height = ((minutes(daily.end) - minutes(daily.start)) / 1440) * 100;
              return (
                <div
                  key={ymd}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="text-xs text-muted-foreground">{WEEKDAYS[ymdDow(ymd)].label}</span>
                  <span className="text-xs font-medium text-foreground">{Number(ymd.slice(8))}</span>
                  <div className="relative h-40 w-full rounded bg-muted">
                    {isOn && (
                      <div
                        className="absolute inset-x-0.5 rounded bg-primary/20 ring-1 ring-primary/40"
                        style={isContinuous ? { top: 0, height: "100%" } : { top: `${top}%`, height: `${Math.max(height, 2)}%` }}
                        title={`${programName} ${daily.start} – ${daily.end}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>00:00</span>
            <span>12:00</span>
            <span>24:00</span>
          </p>
        </div>
      )}

      <dl className="flex flex-col gap-2 rounded-lg bg-muted/50 p-3 text-xs">
        <p className="text-sm font-semibold text-foreground">Schedule Summary</p>
        {[
          [days.label, days.value],
          ["Time Range", isContinuous ? "Continuous" : windowLabel(draft)],
          ["Time Zone", zone],
        ].map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2"
          >
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
