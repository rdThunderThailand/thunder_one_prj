"use client";

// Title, the saved badge, and the five actions. Its own file since ticket 25 because ticket
// 28 owns Save / Activate / Save as Template and their disabled reasons — it should not have
// to reach into the page component to change them.

import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonClasses } from "@/components/ui/Button";
import type { CompositionStatus } from "../types";

/** One row of the split button's menu. Closes the `<details>` it lives in on the way out, so
 *  the menu is not left hanging over the page the operator just navigated away from. */
function MenuItem({ label, reason, disabled, onSelect }: {
  label: string;
  /** Why this action is unavailable, shown on hover. `null` means it is available. */
  reason: string | null;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || !!reason}
      title={reason ?? undefined}
      onClick={(event) => {
        const menu = event.currentTarget.closest("details");
        if (menu) menu.open = false;
        onSelect();
      }}
      className="rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent dark:text-zinc-200 dark:hover:bg-zinc-800 dark:disabled:text-zinc-600"
    >
      {label}
    </button>
  );
}

export function CompositionEditorHeader({
  isExisting,
  name,
  onNameChange,
  savedAt,
  saving,
  canPreview,
  canFullPreview,
  canSaveAsTemplate,
  status,
  hasLayout,
  isComplete,
  unboundZoneNames,
  onCancel,
  onPreview,
  onFullPreview,
  onUseInProgram,
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
  /** Drives both the primary action's meaning ("keep the current status") and whether
   *  `Save & Activate` is offered at all. */
  status: CompositionStatus;
  hasLayout: boolean;
  isComplete: boolean;
  unboundZoneNames: string[];
  onCancel: () => void;
  onPreview: () => void;
  onFullPreview: () => void;
  /** ADR 0063 §7: the frames' `Publish` button, relabelled — the editor has no schedule and
   *  no target field, so it hands off to the Publication wizard instead of publishing. */
  onUseInProgram: () => void;
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
  // ADR 0049 §10 via ADR 0063 §8: the menu item states *how many* Zones are still unbound,
  // which the frames' single button had no room to say.
  const activateDisabledReason = saveDisabledReason
    ?? (!isComplete ? `ยังไม่ได้ผูก Content ให้ ${unboundZoneNames.length} Zone: ${unboundZoneNames.join(", ")}` : null);
  const draftDisabledReason = saveDisabledReason
    ?? (status !== "draft" ? "Composition นี้เปิดใช้งานแล้ว ย้อนกลับเป็น Draft ไม่ได้" : null);

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
            onClick={onUseInProgram}
            disabled={!isExisting}
            title={!isExisting ? "บันทึก Layout ก่อนนำไปใช้ใน Program" : undefined}
          >
            Use in Program →
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

          {/* ADR 0063 §8's split button. Native <details> rather than a popover component the
              repo does not have — it opens, closes on Escape, and closes on blur below. */}
          <div className="flex">
            <Button
              className="rounded-r-none"
              onClick={onSaveDraft}
              disabled={saving || !!saveDisabledReason}
              title={saveDisabledReason ?? undefined}
            >
              {saving ? "กำลังบันทึก..." : "Save Layout"}
            </Button>
            <details
              className="relative"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
              }}
            >
              <summary
                aria-label="ตัวเลือกการบันทึก"
                className={`${buttonClasses()} cursor-pointer rounded-l-none border-l border-white/25 px-2 list-none [&::-webkit-details-marker]:hidden`}
              >
                ▾
              </summary>
              <div className="absolute right-0 z-10 mt-1 flex w-56 flex-col rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                <MenuItem label="Save as draft" reason={draftDisabledReason} disabled={saving} onSelect={onSaveDraft} />
                <MenuItem label="Save & Activate" reason={activateDisabledReason} disabled={saving} onSelect={onActivate} />
              </div>
            </details>
          </div>
        </div>
      }
    />
  );
}
