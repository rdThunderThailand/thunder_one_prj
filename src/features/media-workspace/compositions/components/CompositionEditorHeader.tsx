"use client";

// Title, the saved badge, and the five actions. Its own file since ticket 25 because ticket
// 28 owns Save / Activate / Save as Template and their disabled reasons — it should not have
// to reach into the page component to change them.

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";

export function CompositionEditorHeader({
  isExisting,
  name,
  onNameChange,
  savedAt,
  saving,
  canPreview,
  canFullPreview,
  canSaveAsTemplate,
  canActivate,
  hasLayout,
  isComplete,
  unboundZoneNames,
  onCancel,
  onPreview,
  onFullPreview,
  onSaveDraft,
  onSaveAsTemplate,
  onActivate,
}: {
  isExisting: boolean;
  /** The same state the Properties panel edits — two inputs, one source of truth. */
  name: string;
  onNameChange: (next: string) => void;
  /** `null` means nothing has ever been written for this canvas. */
  savedAt: Date | null;
  saving: boolean;
  canPreview: boolean;
  canFullPreview: boolean;
  canSaveAsTemplate: boolean;
  canActivate: boolean;
  hasLayout: boolean;
  isComplete: boolean;
  unboundZoneNames: string[];
  onCancel: () => void;
  onPreview: () => void;
  onFullPreview: () => void;
  onSaveDraft: () => void;
  onSaveAsTemplate: () => void;
  onActivate: () => void;
}) {
  // ADR 0063 §2: `Unsaved` until the first write, `Last saved HH:MM` after. The frames'
  // "Saved just now" on a never-saved blank canvas is a claim the editor cannot make.
  // The buttons own the reasons they are off, so the page does not have to restate them.
  const saveDisabledReason = !name.trim()
    ? "กรุณากรอกชื่อ Layout"
    : !hasLayout ? "กรุณาเลือก Template หรือ Start blank" : null;
  const activateDisabledReason = saveDisabledReason
    ?? (!isComplete ? `ยังไม่ได้ผูก Content ให้ Zone: ${unboundZoneNames.join(", ")}` : null);

  const badge = savedAt
    ? `Last saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "Unsaved";

  return (
    <PageHeader
      title={
        <input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          aria-label="Layout name"
          placeholder={isExisting ? "Edit Layout" : "New Layout"}
          className="w-full max-w-md rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-2xl font-semibold text-zinc-900 outline-none hover:border-zinc-200 focus:border-indigo-500 dark:text-zinc-50 dark:hover:border-zinc-700"
        />
      }
      subtitle={badge}
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="secondary" onClick={onPreview} disabled={!canPreview}>Preview</Button>
          <Button
            variant="secondary"
            onClick={onFullPreview}
            disabled={!canFullPreview}
            title={!isExisting ? "บันทึก Draft ก่อนเปิด preview เต็มจอ" : undefined}
          >
            Open full preview
          </Button>
          <Button
            variant="secondary"
            onClick={onSaveDraft}
            disabled={saving || !!saveDisabledReason}
            title={saveDisabledReason ?? undefined}
          >
            {saving ? "กำลังบันทึก..." : "Save draft"}
          </Button>
          {canSaveAsTemplate && (
            <Button
              variant="secondary"
              onClick={onSaveAsTemplate}
              disabled={saving || !!saveDisabledReason}
              title={saveDisabledReason ?? undefined}
            >
              Save as Template
            </Button>
          )}
          {canActivate && (
            <Button
              onClick={onActivate}
              disabled={saving || !!activateDisabledReason}
              title={activateDisabledReason ?? undefined}
            >
              Activate
            </Button>
          )}
        </div>
      }
    />
  );
}
