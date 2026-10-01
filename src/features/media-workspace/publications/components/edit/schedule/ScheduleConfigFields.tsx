"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Input } from "@/components/ui/lovable/input";
import { Label } from "@/components/ui/lovable/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { TIMEZONES, WEEKDAYS } from "../../../schedule";
import type { DraftErrors, ScheduleDraft } from "../../../schedule-preset";
import { DatesCalendar } from "./DatesCalendar";
import { MonthDaysGrid } from "./MonthDaysGrid";

const MONDAY_FIRST = [...WEEKDAYS.slice(1), WEEKDAYS[0]];

function Step({ n, title, hint, children }: { n: number; title: string; hint: string; children: ReactNode }) {
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

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-danger">{message}</p> : null;
}

function DateField({ id, label, value, optional, onChange }: { id: string; label: string; value: string; optional?: boolean; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </Label>
      <Input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function TimezoneField({ value, onChange }: { value: string; onChange: (timezone: string) => void }) {
  const zones = TIMEZONES.some((z) => z.id === value) ? TIMEZONES : [...TIMEZONES, { id: value, label: value }];
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Time Zone</Label>
      <Select
        value={value}
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

function TimeField({ id, label, value, disabled, onChange }: { id: string; label: string; value: string; disabled?: boolean; onChange: (v: string) => void }) {
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

export function ScheduleConfigFields({
  draft,
  errors,
  today,
  isDateRange,
  onChange,
}: {
  draft: ScheduleDraft;
  errors: DraftErrors;
  today: string;
  isDateRange: boolean;
  onChange: (change: Partial<ScheduleDraft>) => void;
}) {
  return (
    // @container: the wizard shows these fields in a narrow column, so they stack by their own width, not the viewport.
    <div className="@container flex flex-col gap-6">
      {(draft.mode === "weekly" || draft.mode === "monthly") && (
        <Step
          n={1}
          title={draft.mode === "monthly" ? "Select Days of the Month" : isDateRange ? "Select Date Range" : "Select Days"}
          hint={isDateRange ? "เลือกช่วงวันที่ต้องการออกอากาศ" : "เลือกวันที่ออกอากาศ"}
        >
          {draft.mode === "monthly" && (
            <MonthDaysGrid
              value={draft.monthDays}
              onChange={(monthDays) => onChange({ monthDays })}
            />
          )}
          {draft.mode === "weekly" && !isDateRange && (
            <div className="flex flex-wrap gap-1.5">
              {MONDAY_FIRST.map((day) => {
                const isOn = draft.days.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    aria-pressed={isOn}
                    onClick={() =>
                      onChange({ days: isOn ? draft.days.filter((d) => d !== day.value) : [...draft.days, day.value] })
                    }
                    className={
                      isOn
                        ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                        : "rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                    }
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          )}
          <FieldError message={errors.days ?? errors.monthDays} />
          <div className="grid gap-3 @sm:grid-cols-2">
            <DateField
              id="schedule-start-date"
              label="Start date"
              value={draft.startDate}
              onChange={(startDate) => onChange({ startDate })}
            />
            <DateField
              id="schedule-end-date"
              label="End date"
              optional={!isDateRange}
              value={draft.endDate}
              onChange={(endDate) => onChange({ endDate })}
            />
          </div>
          <FieldError message={errors.startDate ?? errors.endDate} />
        </Step>
      )}
      {draft.mode === "dates" && (
        <Step
          n={1}
          title="Select Custom Days"
          hint="เลือกวันที่ต้องการออกอากาศ"
        >
          <DatesCalendar
            dates={draft.dates}
            today={today}
            onChange={(dates) => onChange({ dates })}
          />
          <FieldError message={errors.dates} />
        </Step>
      )}
      {draft.mode === "one-time" && (
        <Step
          n={1}
          title="Select Date"
          hint="เลือกวันที่ต้องการออกอากาศ"
        >
          <DateField
            id="schedule-date"
            label="Date"
            value={draft.startDate}
            onChange={(startDate) => onChange({ startDate })}
          />
          <FieldError message={errors.startDate} />
        </Step>
      )}

      {draft.mode === "continuous" && (
        <Step
          n={1}
          title="Start and End"
          hint="ออกอากาศต่อเนื่องตั้งแต่เวลาเริ่ม ไม่มีช่วงเวลาประจำวัน — เล่นข้ามคืน"
        >
          <div className="grid gap-3 @sm:grid-cols-2">
            <DateField
              id="schedule-start-date"
              label="Start date"
              value={draft.startDate}
              onChange={(startDate) => onChange({ startDate })}
            />
            <TimeField
              id="schedule-start-time"
              label="Start time"
              value={draft.startTime}
              onChange={(startTime) => onChange({ startTime })}
            />
            <DateField
              id="schedule-end-date"
              label="End date"
              optional
              value={draft.endDate}
              onChange={(endDate) => onChange({ endDate })}
            />
            <TimeField
              id="schedule-end-time"
              label="End time"
              value={draft.endTime}
              disabled={!draft.endDate}
              onChange={(endTime) => onChange({ endTime })}
            />
          </div>
          <FieldError message={errors.startDate ?? errors.endDate} />
          <div className="max-w-xs">
            <TimezoneField
              value={draft.timezone}
              onChange={(timezone) => onChange({ timezone })}
            />
          </div>
        </Step>
      )}

      {draft.mode !== "continuous" && (
        <Step
          n={2}
          title={draft.mode === "one-time" ? "Time Range" : "Daily Time Range"}
          hint={draft.mode === "one-time" ? "กำหนดช่วงเวลา (ออกอากาศครั้งเดียว)" : "กำหนดช่วงเวลา (ใช้เหมือนกันทุกวันที่เลือก)"}
        >
          <div className="grid gap-3 @sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.6fr)]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="schedule-start-time">Start time</Label>
              <Input
                id="schedule-start-time"
                type="time"
                value={draft.allDay ? "00:00" : draft.dailyStart}
                disabled={draft.allDay}
                onChange={(event) => onChange({ dailyStart: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="schedule-end-time">End time</Label>
              <Input
                id="schedule-end-time"
                type="time"
                value={draft.allDay ? "23:59" : draft.dailyEnd}
                disabled={draft.allDay}
                onChange={(event) => onChange({ dailyEnd: event.target.value })}
              />
            </div>
            <TimezoneField
              value={draft.timezone}
              onChange={(timezone) => onChange({ timezone })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={draft.allDay}
              // Leaving all day with the 00:00-23:59 sentinel still in the fields would store all day again.
              onCheckedChange={(checked) =>
                onChange(
                  checked !== true && draft.dailyStart === "00:00" && draft.dailyEnd === "23:59"
                    ? { allDay: false, dailyStart: "09:00", dailyEnd: "18:00" }
                    : { allDay: checked === true },
                )
              }
            />
            All day (00:00 – 24:00)
          </label>
          <FieldError message={errors.time} />
        </Step>
      )}
    </div>
  );
}
