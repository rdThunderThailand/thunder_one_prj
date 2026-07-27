"use client";

import { useEffect, useMemo, useState } from "react";
import type { ScheduleConflict, ScheduleForm, ScheduleType } from "../types";
import { SCHEDULE_TYPES } from "../types";
import { TIMEZONES, WEEKDAYS, isScheduleFormValid, scheduleFormToPayload } from "../schedule";
import { checkScheduleConflicts } from "../services/publications-api";

type ScheduleStepProps = {
  form: ScheduleForm;
  onChange: (updates: Partial<ScheduleForm>) => void;
  deviceIds: string[];
  publicationId: string | null;
};

const SCHEDULE_TYPE_LABELS: Record<ScheduleType, string> = {
  now: "Publish Now",
  later: "Schedule Later",
  recurring: "Recurring Schedule",
  range: "Custom Date Range",
};

export function ScheduleStep({ form, onChange, deviceIds, publicationId }: ScheduleStepProps) {
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [checking, setChecking] = useState<boolean>(false);
  const [hasExpiration, setHasExpiration] = useState<boolean>(() => Boolean(form.end_date));

  const deviceIdsKey = useMemo(() => deviceIds.join(","), [deviceIds]);
  const daysKey = useMemo(() => form.days.join(","), [form.days]);
  const isValid = useMemo(() => isScheduleFormValid(form), [form]);

  useEffect(() => {
    if (deviceIds.length === 0 || !isValid) return;
    let cancelled = false;

    const timer = setTimeout(() => {
      setChecking(true);
      const payload = scheduleFormToPayload(form);
      checkScheduleConflicts({
        publication_id: publicationId,
        device_ids: deviceIds,
        starts_at: payload.starts_at,
        ends_at: payload.ends_at,
      })
        .then((res) => {
          if (!cancelled) {
            setConflicts(res);
            setChecking(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setConflicts([]);
            setChecking(false);
          }
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form, daysKey, deviceIdsKey, deviceIds, publicationId, isValid]);

  const activeConflicts = useMemo(
    () => (deviceIds.length > 0 && isValid ? conflicts : []),
    [deviceIds.length, isValid, conflicts]
  );

  const handleExpirationToggle = (checked: boolean) => {
    setHasExpiration(checked);
    if (!checked) onChange({ end_date: "", end_time: "" });
  };

  const handleDayToggle = (dayValue: number) => {
    const nextDays = form.days.includes(dayValue)
      ? form.days.filter((d) => d !== dayValue)
      : [...form.days, dayValue].sort((a, b) => a - b);
    onChange({ days: nextDays });
  };

  const renderStartFields = (dateLabel = "Publish Date", timeLabel = "Publish Time") => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{dateLabel}</label>
        <input type="date" value={form.start_date} onChange={(e) => onChange({ start_date: e.target.value })} className="w-full rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{timeLabel}</label>
        <input type="time" value={form.start_time} onChange={(e) => onChange({ start_time: e.target.value })} className="w-full rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
      </div>
    </div>
  );

  const renderEndFields = (dateLabel = "End Date", timeLabel = "End Time") => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{dateLabel}</label>
        <input type="date" value={form.end_date} onChange={(e) => onChange({ end_date: e.target.value })} className="w-full rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{timeLabel}</label>
        <input type="time" value={form.end_time} onChange={(e) => onChange({ end_time: e.target.value })} className="w-full rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
      </div>
    </div>
  );

  const renderTimezoneSelect = () => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Timezone</label>
      <select value={form.timezone} onChange={(e) => onChange({ timezone: e.target.value })} className="w-full rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
        {TIMEZONES.map((tz) => (
          <option key={tz.id} value={tz.id}>{tz.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Schedule Type</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SCHEDULE_TYPES.map((type) => {
            const isActive = form.schedule_type === type;
            return (
              <button key={type} type="button" onClick={() => onChange({ schedule_type: type })} className={`px-3 py-1.5 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-700 transition-colors ${isActive ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                {SCHEDULE_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Schedule Details</h3>

        {form.schedule_type === "now" && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Publishes immediately once the publication is activated.
          </p>
        )}

        {form.schedule_type === "later" && (
          <div className="space-y-4">
            {renderStartFields("Publish Date", "Publish Time")}
            {renderTimezoneSelect()}
            <div className="pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                <input type="checkbox" checked={hasExpiration} onChange={(e) => handleExpirationToggle(e.target.checked)} className="rounded border-zinc-300 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800" />
                Set expiration date
              </label>
            </div>
            {hasExpiration && renderEndFields("End Date", "End Time")}
          </div>
        )}

        {form.schedule_type === "range" && (
          <div className="space-y-4">
            {renderStartFields("Start Date", "Start Time")}
            {renderEndFields("End Date", "End Time")}
            {renderTimezoneSelect()}
          </div>
        )}

        {form.schedule_type === "recurring" && (
          <div className="space-y-4">
            {renderStartFields("Start Date", "Start Time")}
            {renderEndFields("End Date", "End Time")}
            {renderTimezoneSelect()}

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Repeat On</label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((w) => {
                  const isSelected = form.days.includes(w.value);
                  return (
                    <button key={w.value} type="button" onClick={() => handleDayToggle(w.value)} className={`px-3 py-1.5 text-xs font-medium rounded border border-zinc-300 dark:border-zinc-700 transition-colors ${isSelected ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300"}`}>
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Daily Window From</label>
                <input type="time" value={form.daily_start} onChange={(e) => onChange({ daily_start: e.target.value })} className="w-full rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Daily Window To</label>
                <input type="time" value={form.daily_end} onChange={(e) => onChange({ daily_end: e.target.value })} className="w-full rounded border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" />
              </div>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Plays on the selected weekdays, within this daily time window, across the date range above.
            </p>
          </div>
        )}
      </div>

      {checking && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Checking for schedule conflicts…</p>
      )}

      {activeConflicts.length > 0 && (
        <div className="rounded-md bg-amber-50 p-4 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 text-amber-800 dark:text-amber-300 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs font-semibold">
              ⚠ Schedule conflict — {activeConflicts.length} publication(s) already use these screens in an overlapping time window
            </h4>
            <span className="text-[11px] opacity-80 shrink-0">Warning only (you can still continue)</span>
          </div>
          <div className="space-y-2 text-xs">
            {activeConflicts.map((c) => {
              const startStr = new Date(c.starts_at).toLocaleString();
              const endStr = c.ends_at ? new Date(c.ends_at).toLocaleString() : "no end";
              return (
                <div key={c.publication_id} className="border-t border-amber-200 dark:border-amber-800/50 pt-2 first:border-0 first:pt-0">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-[11px] opacity-90">Window: {startStr} – {endStr}</div>
                  {c.screens.length > 0 && <div className="text-[11px] opacity-80">Screens: {c.screens.join(", ")}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
