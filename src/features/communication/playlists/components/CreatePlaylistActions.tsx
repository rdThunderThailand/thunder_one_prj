"use client";

import { Button } from "@/components/ui/Button";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "@/components/ui/icons";

export function CreatePlaylistActions({
  step,
  lastStep,
  isEditing,
  savingDraft,
  submitting,
  onBack,
  onSaveDraft,
  onNext,
  onSubmit,
}: {
  step: number;
  lastStep: number;
  isEditing: boolean;
  savingDraft: boolean;
  submitting: boolean;
  onBack: () => void;
  onSaveDraft: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <Button variant="secondary" onClick={onBack} disabled={savingDraft || submitting}>
        <ArrowLeftIcon className="h-4 w-4" />
        {step === 1 ? "Back: Playlists" : "Back"}
      </Button>
      {step < lastStep && (
        <Button variant="secondary" onClick={onSaveDraft} disabled={savingDraft || submitting}>
          {savingDraft ? "กำลังบันทึก..." : "Save Draft"}
        </Button>
      )}
      {step < lastStep ? (
        <Button onClick={onNext} disabled={savingDraft}>
          Next
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={onSubmit} disabled={savingDraft || submitting}>
          {submitting ? (
            "กำลังบันทึก..."
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              {isEditing ? "Save Changes" : "Create Playlist"}
            </>
          )}
        </Button>
      )}
    </>
  );
}
