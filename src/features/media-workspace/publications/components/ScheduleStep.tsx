"use client";

import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { WEEKDAYS } from "../schedule";
import { describeSchedule } from "../schedule-describe";
import { draftToSchedule, scheduleToDraft, todayIn, validateDraft } from "../schedule-preset";
import type { ScheduleConflict } from "../types";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { EditScheduleModal } from "./edit/EditScheduleModal";

export interface ScheduleStepProps {
  conflicts?: ScheduleConflict[];
  checkingConflicts?: boolean;
  conflictsError?: string | null;
  showErrors?: boolean;
}

/** Frame 3 "2. When to Play" box: a read-only summary of the draft's schedule. The preset list,
 *  fields and preview live in the Edit Schedule modal, the same dialog the Edit page uses
 *  (ADR 0083); the conflict detail lives on Frame 4. */
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
  const [editing, setEditing] = useState(false);

  const messages = Object.values(validateDraft(schedule, today));
  const isInvalid = messages.length > 0;
  const stored = isInvalid ? null : draftToSchedule(schedule);
  const summary = stored ? describeSchedule(stored) : null;
  const days = summary?.days.length
    ? WEEKDAYS.filter((day) => summary.days.includes(day.value)).map((day) => day.label).join(", ")
    : null;

  return (
    <div className="flex flex-col gap-4">
      {summary ? (
        <dl className="flex flex-col gap-2 text-sm">
          <SummaryRow label="Schedule">{summary.title}</SummaryRow>
          {days && <SummaryRow label="Days">{days}</SummaryRow>}
          {summary.hours && <SummaryRow label="Hours">{summary.hours}</SummaryRow>}
          <SummaryRow label="Dates">{summary.range}</SummaryRow>
          <SummaryRow label="Timezone">{schedule.timezone}</SummaryRow>
        </dl>
      ) : (
        <ul className={`list-disc space-y-1 pl-5 text-xs ${showErrors ? "text-danger" : "text-muted-foreground"}`}>
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}

      <Button
        variant={isInvalid && showErrors ? "default" : "outline"}
        onClick={() => setEditing(true)}
      >
        Edit schedule
      </Button>

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

      {editing && (
        <EditScheduleModal
          schedule={null}
          initialDraft={schedule}
          playlistId={null}
          hidePlaybackPattern
          programName={programName || "Your Program"}
          onClose={() => setEditing(false)}
          // Back through the stored shape, as a Save → re-open does, so a same-day Continuous
          // reads One-time here exactly as it will everywhere else (ADR 0083 §3).
          onApply={(next) => {
            setSchedule(scheduleToDraft(next, today, schedule.timezone));
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-foreground">{children}</dd>
    </div>
  );
}
