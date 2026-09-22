"use client";

// Everything the editor layers on top of its canvas: the leave confirm, the Save-as-Template
// naming dialog, the save-error banner, and ADR 0052 §3's shared-Template fork card. Split out
// of CompositionEditorPage only to keep that file under the 300-line ceiling — the handlers
// still live there because they touch the draft.

import { Button } from "@/components/ui/lovable/button";
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
  templateSavedName,
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
  templateSavedName: string | null;
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
        <div className="shrink-0 border-b border-danger/30 bg-danger-soft px-4 py-2">
          <p className="text-sm text-danger">{saveError}</p>
        </div>
      )}

      {templateSavedName && (
        <p role="status" className="rounded-lg border border-success/30 bg-success-soft p-3 text-sm text-success">
          Added “{templateSavedName}” to My Templates.
        </p>
      )}

      {sharedTemplateUsage > 1 && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-warning/30 bg-warning-soft px-4 py-2">
          <p className="text-sm text-warning">
            This Template is used by {sharedTemplateUsage} Layouts. Changing the Zones affects all of them.
          </p>
          <Button variant="secondary" disabled={saving} onClick={onForkLayout}>Make this Layout its own copy</Button>
        </div>
      )}
    </>
  );
}
