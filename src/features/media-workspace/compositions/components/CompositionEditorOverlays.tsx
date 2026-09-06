"use client";

// Everything the editor layers on top of its canvas: the leave confirm, the Save-as-Template
// naming dialog, the save-error banner, and ADR 0052 §3's shared-Template fork card. Split out
// of CompositionEditorPage only to keep that file under the 300-line ceiling — the handlers
// still live there because they touch the draft.

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UnsavedLeaveConfirm } from "@/features/media-workspace/playlists/components/UnsavedLeaveConfirm";
import { SaveAsTemplateDialog } from "./SaveAsTemplateDialog";

export function CompositionEditorOverlays({
  confirmLeave,
  onStay,
  onLeave,
  namingTemplate,
  templateDefaultName,
  takenTemplateNames,
  onCloseNaming,
  onConfirmTemplate,
  saveError,
  sharedTemplateUsage,
  saving,
  onForkLayout,
}: {
  confirmLeave: boolean;
  onStay: () => void;
  onLeave: () => void;
  namingTemplate: boolean;
  templateDefaultName: string;
  takenTemplateNames: string[];
  onCloseNaming: () => void;
  onConfirmTemplate: (name: string) => void;
  saveError: string | null;
  sharedTemplateUsage: number;
  saving: boolean;
  onForkLayout: () => void;
}) {
  return (
    <>
      {confirmLeave && <UnsavedLeaveConfirm onStay={onStay} onLeave={onLeave} />}

      {namingTemplate && (
        <SaveAsTemplateDialog
          defaultName={templateDefaultName}
          takenNames={takenTemplateNames}
          onClose={onCloseNaming}
          onConfirm={onConfirmTemplate}
        />
      )}

      {saveError && (
        <Card className="border-red-200 p-4 dark:border-red-900">
          <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
        </Card>
      )}

      {sharedTemplateUsage > 1 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-200 p-4 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            This Template is used by {sharedTemplateUsage} Layouts. Changing the Zones affects all of them.
          </p>
          <Button variant="secondary" disabled={saving} onClick={onForkLayout}>Make this Layout its own copy</Button>
        </Card>
      )}
    </>
  );
}
