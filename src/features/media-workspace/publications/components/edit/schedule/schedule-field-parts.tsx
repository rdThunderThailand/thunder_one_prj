"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Input } from "@/components/ui/lovable/input";
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
  return message ? <p className="text-xs text-danger">{message}</p> : null;
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

export function TimeField({ id, label, value, disabled, onChange }: { id: string; label: string; value: string; disabled?: boolean; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="time"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
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
