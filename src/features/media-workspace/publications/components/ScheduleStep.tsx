"use client";

import { useState, type ReactNode } from "react";
import { CalendarIcon, ChevronDownIcon, LightningIcon, RepeatIcon } from "@/components/ui/icons";
import { CARD_BY_SCHEDULE_TYPE, SCHEDULE_TYPE_BY_CARD } from "../draft-mapping";
import { validateScheduleForm, utcToZonedParts } from "../schedule";
import {
  AdvancedScheduleStubs,
  DateRangeField,
  DateTimeInputs,
  FieldError,
  TimeWindowField,
  TimezoneSelect,
  WeekdayChips,
} from "./schedule-fields";
import type { ScheduleConflict } from "../types";
import { scheduleTypes, type ScheduleTypeId } from "../mock-data";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";

const scheduleTypeIcon: Record<ScheduleTypeId, ReactNode> = {
  "publish-now": <LightningIcon />,
  "schedule-later": <CalendarIcon />,
  recurring: <RepeatIcon />,
  "custom-range": <CalendarIcon />,
};

export interface ScheduleStepProps {
  conflicts?: ScheduleConflict[];
  checkingConflicts?: boolean;
  conflictsError?: string | null;
  showErrors?: boolean;
}

/** Frame 3 "2. When to Play" column. The four Play Mode cards own `scheduleForm.schedule_type`
 *  directly (ADR: ver02 plan-frame3 D1); the conflict detail and calendar live on Frame 4. */
export function ScheduleStep({
  conflicts = [],
  checkingConflicts = false,
  conflictsError = null,
  showErrors = false,
}: ScheduleStepProps) {
  const scheduleForm = usePublicationDraftStore((s) => s.scheduleForm);
  const setScheduleForm = usePublicationDraftStore((s) => s.setScheduleForm);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const patch = (next: Partial<typeof scheduleForm>) =>
    setScheduleForm({ ...scheduleForm, ...next });

  // Recompute every render so a field's error clears the moment it becomes valid
  const fieldErrors = showErrors ? validateScheduleForm(scheduleForm) : {};
  const nowZoned = utcToZonedParts(new Date().toISOString(), scheduleForm.timezone);

  const activeCardId = CARD_BY_SCHEDULE_TYPE[scheduleForm.schedule_type];
  const isRecurring = scheduleForm.schedule_type === "recurring";
  const hasEndPicker =
    scheduleForm.schedule_type === "now" || scheduleForm.schedule_type === "later";
  const noEndDate = !scheduleForm.end_date;
  const allDay = scheduleForm.daily_start === "00:00" && scheduleForm.daily_end === "23:59";

  const toggleDay = (val: number) => {
    const next = scheduleForm.days.includes(val)
      ? scheduleForm.days.filter((d) => d !== val)
      : [...scheduleForm.days, val].sort((a, b) => a - b);
    patch({ days: next });
  };

  // Ticked = "no end date": clears the expiry. Unticked: seed sensible defaults.
  const toggleNoEndDate = (checked: boolean) => {
    if (checked) {
      patch({ end_date: "", end_time: "" });
    } else {
      patch({
        end_date: scheduleForm.end_date || nowZoned.date,
        end_time: scheduleForm.end_time || "23:59",
      });
    }
  };

  const toggleAllDay = (checked: boolean) => {
    patch(
      checked
        ? { daily_start: "00:00", daily_end: "23:59" }
        : { daily_start: "09:00", daily_end: "17:00" },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700">Play Mode</p>
        <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
          {scheduleTypes.map((option) => {
            const active = activeCardId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => patch({ schedule_type: SCHEDULE_TYPE_BY_CARD[option.id] })}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                  active
                    ? "border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <span className={`h-5 w-5 ${active ? "text-indigo-600" : "text-zinc-400"}`}>
                  {scheduleTypeIcon[option.id]}
                </span>
                <span className="text-xs font-semibold text-zinc-900">{option.label}</span>
                <span className="text-[11px] text-zinc-400">{option.sublabel}</span>
              </button>
            );
          })}
          <span
            title="ยังไม่เปิดใช้งาน"
            className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center opacity-60"
          >
            <span className="h-5 w-5 text-zinc-400">
              <LightningIcon />
            </span>
            <span className="text-xs font-semibold text-zinc-400">Event</span>
            <span className="text-[11px] text-zinc-300">ตามเหตุการณ์</span>
          </span>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700">
          Publish Date &amp; Time
        </label>
        {scheduleForm.schedule_type === "now" ? (
          <>
            <DateTimeInputs date={nowZoned.date} time={nowZoned.time} disabled />
            <p className="mt-1.5 text-xs text-zinc-500">Publishes immediately once activated.</p>
          </>
        ) : (
          <DateTimeInputs
            date={scheduleForm.start_date}
            time={scheduleForm.start_time}
            onDateChange={(v) => patch({ start_date: v })}
            onTimeChange={(v) => patch({ start_time: v })}
            dateError={fieldErrors.start_date}
            timeError={fieldErrors.start_time}
          />
        )}
        <FieldError message={fieldErrors.start_date} />
        <FieldError message={fieldErrors.start_time} />
      </div>

      {(scheduleForm.schedule_type === "range" || isRecurring) && (
        <DateRangeField
          date={scheduleForm.end_date}
          time={scheduleForm.end_time}
          onDateChange={(v) => patch({ end_date: v })}
          onTimeChange={(v) => patch({ end_time: v })}
          dateError={fieldErrors.end_date}
          timeError={fieldErrors.end_time}
        />
      )}

      {hasEndPicker && (
        <div>
          <label className="mb-1.5 flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={noEndDate}
              disabled={scheduleForm.days.length > 0}
              title={
                scheduleForm.days.length > 0
                  ? "ตารางแบบรายสัปดาห์ต้องมีวันสิ้นสุด"
                  : undefined
              }
              onChange={(e) => toggleNoEndDate(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
            No end date
          </label>
          {!noEndDate && (
            <DateTimeInputs
              date={scheduleForm.end_date}
              time={scheduleForm.end_time}
              onDateChange={(v) => patch({ end_date: v })}
              onTimeChange={(v) => patch({ end_time: v })}
            />
          )}
        </div>
      )}

      {isRecurring && (
        <>
          <WeekdayChips selected={scheduleForm.days} onToggle={toggleDay} error={fieldErrors.days} />
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-700">Time — every day</span>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-500">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => toggleAllDay(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                All day
              </label>
            </div>
            {!allDay && (
              <TimeWindowField
                start={scheduleForm.daily_start}
                end={scheduleForm.daily_end}
                onStartChange={(v) => patch({ daily_start: v })}
                onEndChange={(v) => patch({ daily_end: v })}
                startError={fieldErrors.daily_start}
                endError={fieldErrors.daily_end}
              />
            )}
          </div>
        </>
      )}

      {(checkingConflicts || conflictsError || conflicts.length > 0) && (
        <div
          className={`rounded-lg border p-3 text-xs ${
            conflictsError
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {checkingConflicts
            ? "กำลังตรวจสอบความขัดแย้งของตารางเผยแพร่…"
            : conflictsError
            ? `ตรวจสอบความขัดแย้งไม่สำเร็จ: ${conflictsError} — เผยแพร่ได้ตามปกติ`
            : `พบ ${conflicts.length} publication ที่ priority ทับซ้อน — ดูรายละเอียดในขั้นตอน Review`}
        </div>
      )}

      <div className="border-t border-zinc-100 pt-4">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-medium text-zinc-900"
        >
          Advanced Schedule
          <ChevronDownIcon
            className={`h-4 w-4 text-zinc-400 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
          />
        </button>
        {advancedOpen && (
          <div className="mt-3 flex flex-col gap-4">
            <TimezoneSelect value={scheduleForm.timezone} onChange={(v) => patch({ timezone: v })} />
            <AdvancedScheduleStubs />
          </div>
        )}
      </div>
    </div>
  );
}
