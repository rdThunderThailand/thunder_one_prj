"use client";

import { ChevronDownIcon, InfoIcon } from "@/components/ui/icons";
import { TIMEZONES, WEEKDAYS } from "../schedule";
import { delayUnits } from "../mock-data";

const inputBase =
  "rounded-lg border px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-400";

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs font-medium text-red-600">{message}</p> : null;
}

/** The date+time input pair the schedule step repeats for start, end and expiry. */
export function DateTimeInputs({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateError,
  timeError,
  disabled = false,
}: {
  date: string;
  time: string;
  onDateChange?: (value: string) => void;
  onTimeChange?: (value: string) => void;
  dateError?: string;
  timeError?: string;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <input
        type="date"
        value={date}
        disabled={disabled}
        onChange={onDateChange ? (e) => onDateChange(e.target.value) : undefined}
        aria-invalid={!!dateError}
        className={`${inputBase} ${dateError ? "border-red-400" : "border-zinc-200"}`}
      />
      <input
        type="time"
        value={time}
        disabled={disabled}
        onChange={onTimeChange ? (e) => onTimeChange(e.target.value) : undefined}
        aria-invalid={!!timeError}
        className={`${inputBase} ${timeError ? "border-red-400" : "border-zinc-200"}`}
      />
    </div>
  );
}

/** Labelled end date+time, required by the `range` and `recurring` schedule types. */
export function DateRangeField({
  label = "End Date & Time",
  date,
  time,
  onDateChange,
  onTimeChange,
  dateError,
  timeError,
}: {
  label?: string;
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  dateError?: string;
  timeError?: string;
}) {
  return (
    <div className="mt-4">
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</label>
      <DateTimeInputs
        date={date}
        time={time}
        onDateChange={onDateChange}
        onTimeChange={onTimeChange}
        dateError={dateError}
        timeError={timeError}
      />
      <FieldError message={dateError} />
      <FieldError message={timeError} />
    </div>
  );
}

/** The recurring "Daily Window" — a start/end time-of-day pair. */
export function TimeWindowField({
  start,
  end,
  onStartChange,
  onEndChange,
  startError,
  endError,
}: {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  startError?: string;
  endError?: string;
}) {
  return (
    <div className="mt-4">
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">Daily Window</label>
      <div className="grid grid-cols-2 gap-2.5">
        <input
          type="time"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          aria-invalid={!!startError}
          className={`${inputBase} ${startError ? "border-red-400" : "border-zinc-200"}`}
        />
        <input
          type="time"
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          aria-invalid={!!endError}
          className={`${inputBase} ${endError ? "border-red-400" : "border-zinc-200"}`}
        />
      </div>
      <FieldError message={startError} />
      <FieldError message={endError} />
      <p className="mt-1.5 text-xs text-zinc-500">
        Plays on the selected weekdays, within this daily time window, across the date range above.
      </p>
    </div>
  );
}

/** Weekday multi-select chips for the recurring schedule. */
export function WeekdayChips({
  selected,
  onToggle,
  error,
}: {
  selected: number[];
  onToggle: (value: number) => void;
  error?: string;
}) {
  return (
    <div className="mt-4">
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">Repeat On</label>
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((w) => {
          const isSelected = selected.includes(w.value);
          return (
            <button
              key={w.value}
              type="button"
              onClick={() => onToggle(w.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {w.label}
            </button>
          );
        })}
      </div>
      <FieldError message={error} />
    </div>
  );
}

export function TimezoneSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-4">
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">Time Zone</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.id} value={tz.id}>
              {tz.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      </div>
    </div>
  );
}

/** DISABLED, not built yet — the Advanced Schedule block's inert controls. */
export function AdvancedScheduleStubs() {
  return (
    <>
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
          Publish Order
          <span title="ยังไม่เปิดใช้งาน">
            <InfoIcon className="h-3.5 w-3.5 text-zinc-400" />
          </span>
        </p>
        <div className="flex flex-col gap-2">
          <label title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-2 text-sm text-zinc-400">
            <input type="radio" disabled checked readOnly className="h-4 w-4" />
            Publish to all channels at the same time
          </label>
          <label title="ยังไม่เปิดใช้งาน" className="flex cursor-not-allowed items-center gap-2 text-sm text-zinc-400">
            <input type="radio" disabled checked={false} readOnly className="h-4 w-4" />
            Publish to channels in sequence
          </label>
        </div>
      </div>

      <div className="opacity-50">
        <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-zinc-700">
          Delay between channels
          <span title="ยังไม่เปิดใช้งาน">
            <InfoIcon className="h-3.5 w-3.5 text-zinc-400" />
          </span>
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            disabled
            title="ยังไม่เปิดใช้งาน"
            defaultValue={10}
            className="w-20 cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none"
          />
          <div className="relative flex-1">
            <select
              disabled
              title="ยังไม่เปิดใช้งาน"
              defaultValue="seconds"
              className="w-full cursor-not-allowed appearance-none rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-3 pr-8 text-sm text-zinc-900 outline-none"
            >
              {delayUnits.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>
      </div>
    </>
  );
}
