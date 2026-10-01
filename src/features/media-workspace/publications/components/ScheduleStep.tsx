"use client";

import { useState } from "react";
import { applyPreset, presetOf, todayIn, validateDraft } from "../schedule-preset";
import type { ScheduleConflict } from "../types";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { ScheduleConfigFields } from "./edit/schedule/ScheduleConfigFields";
import { SchedulePresetList } from "./edit/schedule/SchedulePresetList";
import { SchedulePreviewPane } from "./edit/schedule/SchedulePreviewPane";

export interface ScheduleStepProps {
  conflicts?: ScheduleConflict[];
  checkingConflicts?: boolean;
  conflictsError?: string | null;
  showErrors?: boolean;
}

/** Frame 3 "2. When to Play" column. The same preset list, fields and preview as the Edit Schedule
 *  modal, over one `ScheduleDraft` (ADR 0082); the conflict detail lives on Frame 4. */
export function ScheduleStep({
  conflicts = [],
  checkingConflicts = false,
  conflictsError = null,
  showErrors = false,
}: ScheduleStepProps) {
  const schedule = usePublicationDraftStore((s) => s.schedule);
  const setSchedule = usePublicationDraftStore((s) => s.setSchedule);
  const programName = usePublicationDraftStore((s) => s.basicInfo.name);
  const [today] = useState(() => todayIn(schedule.timezone));

  const preset = presetOf(schedule);
  // Recompute every render so a field's error clears the moment it becomes valid
  const errors = showErrors ? validateDraft(schedule, today) : {};

  return (
    <div className="flex flex-col gap-6">
      <SchedulePresetList
        value={preset}
        onSelect={(next) => setSchedule(applyPreset(schedule, next, today))}
      />
      <ScheduleConfigFields
        draft={schedule}
        errors={errors}
        today={today}
        isDateRange={preset === "date-range"}
        onChange={(change) => setSchedule({ ...schedule, ...change })}
      />

      {(checkingConflicts || conflictsError || conflicts.length > 0) && (
        <div
          className={`rounded-lg border p-3 text-xs ${
            conflictsError
              ? "border-danger/30 bg-danger-soft text-danger"
              : "border-warning/30 bg-warning-soft text-warning"
          }`}
        >
          {checkingConflicts
            ? "กำลังตรวจสอบความขัดแย้งของตารางเผยแพร่…"
            : conflictsError
            ? `ตรวจสอบความขัดแย้งไม่สำเร็จ: ${conflictsError} — เผยแพร่ได้ตามปกติ`
            : `พบ ${conflicts.length} publication ที่ priority ทับซ้อน — ดูรายละเอียดในขั้นตอน Review`}
        </div>
      )}

      <SchedulePreviewPane
        draft={schedule}
        today={today}
        programName={programName || "Your Program"}
      />
    </div>
  );
}
