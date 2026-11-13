"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Label } from "@/components/ui/lovable/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { shiftYmd, TIMEZONES } from "../../../schedule";
import type { ScheduleDraft } from "../../../schedule-preset";
import { DatePickerField } from "./DatePickerField";

export function Step({ n, title, hint, children }: { n: number; title: string; hint: string; children: ReactNode }) {
  return (
    <section className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-error">{message}</p> : null;
}

export function TimezoneField({ value, disabled, onChange }: { value: string; disabled?: boolean; onChange: (timezone: string) => void }) {
  const zones = TIMEZONES.some((z) => z.id === value) ? TIMEZONES : [...TIMEZONES, { id: value, label: value }];
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Time Zone</Label>
      <Select
        value={value}
        disabled={disabled}
        onValueChange={onChange}
      >
        <SelectTrigger aria-label="Time Zone">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {zones.map((zone) => (
            <SelectItem
              key={zone.id}
              value={zone.id}
            >
              {zone.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const TIME_UNITS = (count: number) => Array.from({ length: count }, (_, i) => String(i).padStart(2, "0"));
const HOURS = TIME_UNITS(24);
const MINUTES = TIME_UNITS(60);
const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

/** A 24-hour "HH:mm" field. A native `<input type="time">` follows the OS locale and shows AM/PM, which a page cannot override (#338). */
export function TimeField({ id, label, value, disabled, onChange }: { id: string; label: string; value: string; disabled?: boolean; onChange: (v: string) => void }) {
  const [hour, minute] = /^\d{2}:\d{2}$/.test(value) ? value.split(":") : ["00", "00"];
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div
        role="group"
        aria-label={label}
        className="flex items-center gap-1.5"
      >
        <select
          id={id}
          aria-label={`${label} (hour)`}
          className={SELECT_CLASS}
          value={hour}
          disabled={disabled}
          onChange={(event) => onChange(`${event.target.value}:${minute}`)}
        >
          {HOURS.map((h) => (
            <option
              key={h}
              value={h}
            >
              {h}
            </option>
          ))}
        </select>
        <span aria-hidden="true">:</span>
        <select
          aria-label={`${label} (minute)`}
          className={SELECT_CLASS}
          value={minute}
          disabled={disabled}
          onChange={(event) => onChange(`${hour}:${event.target.value}`)}
        >
          {MINUTES.map((m) => (
            <option
              key={m}
              value={m}
            >
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * QA 2026-10-08 #5: no end is the default; the end date appears only once the operator asks for one.
 * Unticking clears it, which turns a Date range back into Every day (presets are derived, ADR 0082).
 * The end stays editable on a Live Program — it is the one thing ADR 0090 lets it change.
 */
export function EndDateToggle({ draft, today, children, onChange }: {
  draft: ScheduleDraft;
  today: string;
  /** Extra end fields shown with the date, e.g. Continuous' end time. */
  children?: ReactNode;
  onChange: (change: Partial<ScheduleDraft>) => void;
}) {
  const hasEnd = draft.endDate !== "";
  const earliest = draft.startDate > today ? draft.startDate : today;
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <Checkbox
          checked={hasEnd}
          onCheckedChange={(checked) => onChange({ endDate: checked === true ? shiftYmd(earliest, 30) : "" })}
        />
        Set end date
      </label>
      {hasEnd && (
        <div className="grid gap-3 @sm:grid-cols-2">
          <DatePickerField
            id="schedule-end-date"
            label="End date"
            min={earliest}
            value={draft.endDate}
            onChange={(endDate) => onChange({ endDate })}
          />
          {children}
        </div>
      )}
    </div>
  );
}
