"use client";

import { Checkbox } from "@/components/ui/lovable/checkbox";
import { Input } from "@/components/ui/lovable/input";
import { Label } from "@/components/ui/lovable/label";
import { WEEKDAYS } from "../../../schedule";
import type { DraftErrors, ScheduleDraft } from "../../../schedule-preset";
import { DatePickerField } from "./DatePickerField";
import { DatesCalendar } from "./DatesCalendar";
import { DateRangeCalendar } from "./DateRangeCalendar";
import { MonthDaysGrid } from "./MonthDaysGrid";
import { EndDateToggle, FieldError, Step, TimeField, TimezoneField } from "./schedule-field-parts";

const MONDAY_FIRST = [...WEEKDAYS.slice(1), WEEKDAYS[0]];

export function ScheduleConfigFields({
  draft,
  errors,
  today,
  isDateRange,
  showDateRangeCalendar = false,
  isStartLocked = false,
  onChange,
}: {
  draft: ScheduleDraft;
  errors: DraftErrors;
  today: string;
  isDateRange: boolean;
  showDateRangeCalendar?: boolean;
  /** Live Program: everything but the end is read-only (ADR 0090). `<fieldset disabled>` locks the rest natively. */
  isStartLocked?: boolean;
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
          <fieldset
            disabled={isStartLocked}
            className="contents"
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
                      className={`disabled:cursor-not-allowed disabled:opacity-50 ${
                        isOn
                          ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                          : "rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>
          <FieldError message={errors.days ?? errors.monthDays} />
          <div className="grid gap-3 @sm:grid-cols-2">
            <DatePickerField
              id="schedule-start-date"
              label="Start date"
              min={today}
              disabled={isStartLocked}
              value={draft.startDate}
              onChange={(startDate) => onChange({ startDate })}
            />
          </div>
          <EndDateToggle
            draft={draft}
            today={today}
            onChange={onChange}
          />
          <FieldError message={errors.startDate ?? errors.endDate} />
          {isDateRange && showDateRangeCalendar && !isStartLocked && (
            <DateRangeCalendar
              startDate={draft.startDate}
              endDate={draft.endDate}
              today={today}
              onChange={onChange}
            />
          )}
        </Step>
      )}
      {draft.mode === "dates" && (
        <Step
          n={1}
          title="Select Custom Days"
          hint="เลือกวันที่ต้องการออกอากาศ"
        >
          <fieldset
            disabled={isStartLocked}
            className="contents"
          >
            <DatesCalendar
              dates={draft.dates}
              today={today}
              onChange={(dates) => onChange({ dates })}
            />
          </fieldset>
          <FieldError message={errors.dates} />
        </Step>
      )}
      {draft.mode === "one-time" && (
        <Step
          n={1}
          title="Select Date"
          hint="เลือกวันที่ต้องการออกอากาศ"
        >
          <DatePickerField
            id="schedule-date"
            label="Date"
            min={today}
            disabled={isStartLocked}
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
            <DatePickerField
              id="schedule-start-date"
              label="Start date"
              min={today}
              disabled={isStartLocked}
              value={draft.startDate}
              onChange={(startDate) => onChange({ startDate })}
            />
            <TimeField
              id="schedule-start-time"
              label="Start time"
              disabled={isStartLocked}
              value={draft.startTime}
              onChange={(startTime) => onChange({ startTime })}
            />
          </div>
          <EndDateToggle
            draft={draft}
            today={today}
            onChange={onChange}
          >
            <TimeField
              id="schedule-end-time"
              label="End time"
              value={draft.endTime}
              onChange={(endTime) => onChange({ endTime })}
            />
          </EndDateToggle>
          <FieldError message={errors.startDate ?? errors.endDate} />
          <div className="max-w-xs">
            <TimezoneField
              value={draft.timezone}
              disabled={isStartLocked}
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
          <fieldset
            disabled={isStartLocked}
            className="contents"
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
              {/* Explicit too: Radix Select opens on pointerdown, which a disabled fieldset does not stop. */}
              <TimezoneField
                value={draft.timezone}
                disabled={isStartLocked}
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
          </fieldset>
          <FieldError message={errors.time} />
        </Step>
      )}
    </div>
  );
}
