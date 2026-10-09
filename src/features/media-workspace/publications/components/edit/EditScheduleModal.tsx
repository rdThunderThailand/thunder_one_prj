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
  validateDraftNow,
  type ScheduleDraft,
} from "../../schedule-preset";
import type { PublicationSchedule } from "../../types";
import { PlaybackPatternField, type PatternChoice } from "./schedule/PlaybackPatternField";
import { SchedulePresetList } from "./schedule/SchedulePresetList";
import { ScheduleConfigFields } from "./schedule/ScheduleConfigFields";
import { SchedulePreviewPane } from "./schedule/SchedulePreviewPane";

export function EditScheduleModal({
  schedule,
  initialDraft,
  playlistId,
  hidePlaybackPattern = false,
  showDateRangeCalendar = false,
  isStartLocked = false,
  programName,
  onClose,
  onApply,
}: {
  schedule: PublicationSchedule | null;
  /** The Create wizard's own draft; takes the place of `schedule` so an invalid draft keeps its values. */
  initialDraft?: ScheduleDraft;
  /** The bound Playlist; null for a Layout / media Program (Playback Pattern disabled). */
  playlistId: string | null;
  /** The wizard changes the Playlist's pattern in its own How to Play box (ADR 0083). */
  hidePlaybackPattern?: boolean;
  /** Edit page only; the Create wizard retains its current date fields. */
  showDateRangeCalendar?: boolean;
  /** Edit page of a Live / Publishing Program: only the end stays editable (ADR 0090). */
  isStartLocked?: boolean;
  programName: string;
  onClose: () => void;
  onApply: (schedule: PublicationSchedule) => void;
}) {
  const timezone = initialDraft?.timezone || schedule?.timezone || DEFAULT_TIMEZONE;
  const [today] = useState(() => utcToZonedParts(new Date().toISOString(), timezone).date);
  const [draft, setDraft] = useState<ScheduleDraft>(() => initialDraft ?? scheduleToDraft(schedule, today, timezone));
  const [pattern, setPattern] = useState<PatternChoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const preset = presetOf(draft);
  const errors = validateDraftNow(draft, isStartLocked);
  const hasErrors = Object.keys(errors).length > 0;
  const update = (change: Partial<ScheduleDraft>) => setDraft((current) => ({ ...current, ...change }));

  const apply = async () => {
    setApplyError(null);
    if (!hidePlaybackPattern && playlistId && pattern && pattern.selected !== pattern.original) {
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
          <fieldset
            disabled={isStartLocked}
            className="contents"
          >
            <SchedulePresetList
              value={preset}
              className="border-b border-border p-4 lg:border-b-0 lg:border-r"
              onSelect={(next) => setDraft(applyPreset(draft, next, today))}
            />
          </fieldset>
          <div className="flex flex-col gap-6 border-b border-border p-5 lg:border-b-0 lg:border-r">
            <p className="text-sm font-semibold text-foreground">Schedule Configuration</p>
            {isStartLocked && (
              <p className="rounded-lg bg-info-soft px-3 py-2 text-xs text-info">
                Program นี้กำลังออกอากาศ — แก้ได้เฉพาะวันและเวลาสิ้นสุด ถ้าต้องการเปลี่ยนรูปแบบให้สร้าง Program ใหม่
              </p>
            )}
            <ScheduleConfigFields
              draft={draft}
              errors={errors}
              today={today}
              isDateRange={preset === "date-range"}
              showDateRangeCalendar={showDateRangeCalendar}
              isStartLocked={isStartLocked}
              onChange={update}
            />
            {!hidePlaybackPattern && (
              <PlaybackPatternField
                playlistId={playlistId}
                choice={pattern}
                onChange={setPattern}
              />
            )}
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
