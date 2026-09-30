"use client";

import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { setPlaylistPlayMode } from "@/features/media-workspace/playlists";
import { DEFAULT_TIMEZONE, utcToZonedParts } from "../../schedule";
import {
  applyPreset,
  draftToSchedule,
  presetOf,
  scheduleToDraft,
  validateDraft,
  type ScheduleDraft,
  type SchedulePreset,
} from "../../schedule-preset";
import type { PublicationSchedule } from "../../types";
import { PlaybackPatternField, type PatternChoice } from "./schedule/PlaybackPatternField";
import { ScheduleConfigFields } from "./schedule/ScheduleConfigFields";
import { SchedulePreviewPane } from "./schedule/SchedulePreviewPane";

// Plan §2 FE-E: no "Recurring" preset; monthly / continuous schedules show as a locked, selected row.
const PRESETS: { id: SchedulePreset; label: string; hint: string }[] = [
  { id: "everyday", label: "Every day", hint: "ออกอากาศทุกวัน" },
  { id: "weekdays", label: "Weekdays", hint: "จันทร์ - ศุกร์" },
  { id: "weekends", label: "Weekends", hint: "เสาร์ - อาทิตย์" },
  { id: "custom-days", label: "Custom days", hint: "เลือกวันเอง" },
  { id: "date-range", label: "Date range", hint: "กำหนดช่วงวันที่" },
  { id: "one-time", label: "One-time only", hint: "ออกอากาศครั้งเดียว" },
];

function PresetRow({ label, hint, isOn, disabled, onClick }: { label: string; hint: string; isOn: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isOn}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left ${
        isOn ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
      } disabled:cursor-default`}
    >
      <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${isOn ? "border-[5px] border-primary" : "border-border"}`} />
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}

export function EditScheduleModal({
  schedule,
  playlistId,
  programName,
  onClose,
  onApply,
}: {
  schedule: PublicationSchedule | null;
  /** The bound Playlist; null for a Layout / media Program (Playback Pattern disabled). */
  playlistId: string | null;
  programName: string;
  onClose: () => void;
  onApply: (schedule: PublicationSchedule) => void;
}) {
  const timezone = schedule?.timezone || DEFAULT_TIMEZONE;
  const [today] = useState(() => utcToZonedParts(new Date().toISOString(), timezone).date);
  const [draft, setDraft] = useState<ScheduleDraft>(() => scheduleToDraft(schedule, today, timezone));
  const [pattern, setPattern] = useState<PatternChoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const preset = presetOf(draft);
  const errors = validateDraft(draft);
  const hasErrors = Object.keys(errors).length > 0;
  const update = (change: Partial<ScheduleDraft>) => setDraft((current) => ({ ...current, ...change }));

  const apply = async () => {
    setApplyError(null);
    if (playlistId && pattern && pattern.selected !== pattern.original) {
      setBusy(true);
      try {
        await setPlaylistPlayMode(playlistId, pattern.selected);
      } catch {
        setBusy(false);
        return setApplyError("Could not save the Playlist's playback pattern. The schedule was not applied — try again.");
      }
      setBusy(false);
    }
    onApply(draftToSchedule(draft));
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !busy && onClose()}
    >
      <DialogContent className="max-h-[92vh] max-w-6xl gap-0 overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Edit Schedule</DialogTitle>
          <DialogDescription>กำหนดช่วงเวลาออกอากาศของ Program นี้</DialogDescription>
        </DialogHeader>
        <div className="grid lg:grid-cols-[14rem_minmax(0,1fr)_22rem]">
          <div
            role="radiogroup"
            aria-label="Schedule Preset"
            className="flex flex-col gap-2 border-b border-border p-4 lg:border-b-0 lg:border-r"
          >
            <p className="text-sm font-semibold text-foreground">Schedule Preset</p>
            {draft.locked && (
              <PresetRow
                label={draft.locked.kind === "monthly" ? "Monthly" : "Continuous"}
                hint="แก้ไขแบบนี้ไม่ได้ในหน้านี้ — เลือกแบบอื่นเพื่อแทนที่"
                isOn
                disabled
              />
            )}
            {PRESETS.map((p) => (
              <PresetRow
                key={p.id}
                label={p.label}
                hint={p.hint}
                isOn={preset === p.id}
                onClick={() => setDraft(applyPreset(draft, p.id, today))}
              />
            ))}
          </div>
          <div className="flex flex-col gap-6 border-b border-border p-5 lg:border-b-0 lg:border-r">
            <p className="text-sm font-semibold text-foreground">Schedule Configuration</p>
            {draft.mode === "locked" ? (
              <p className="text-sm text-muted-foreground">Pick a preset on the left to replace this schedule.</p>
            ) : (
              <ScheduleConfigFields
                draft={draft}
                errors={errors}
                today={today}
                isDateRange={preset === "date-range"}
                onChange={update}
              />
            )}
            <PlaybackPatternField
              playlistId={playlistId}
              choice={pattern}
              onChange={setPattern}
            />
          </div>
          <div className="p-5">
            <SchedulePreviewPane
              draft={draft}
              today={today}
              programName={programName}
            />
          </div>
        </div>
        <DialogFooter className="items-center border-t border-border px-6 py-4">
          {applyError && (
            <p
              role="alert"
              className="mr-auto text-sm text-danger"
            >
              {applyError}
            </p>
          )}
          <Button
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={hasErrors || busy}
            onClick={apply}
          >
            {busy ? "Saving…" : "Apply Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
