"use client";

// Title, the saved badge, and the five actions. Its own file since ticket 25 because ticket
// 28 owns Save / Activate / Save as Template and their disabled reasons — it should not have
// to reach into the page component to change them.

import { useRef, useState } from "react";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { ArrowLeftIcon, CheckIcon, EditIcon, EyeIcon, RedoIcon, UndoIcon } from "@/components/ui/icons";
import { saveAction } from "../status-display";
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
  status,
  referenceResolution,
  aspectRatio,
  zoneCount,
  hasLayout,
  isComplete,
  unboundZoneNames,
  onBack,
  onPreview,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hasUnsavedChanges,
  onPublish,
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
  /** Drives both the primary action's meaning ("keep the current status") and whether
   *  `Save & Activate` is offered at all. */
  status: CompositionStatus;
  referenceResolution: string | null;
  aspectRatio: string;
  zoneCount: number;
  hasLayout: boolean;
  isComplete: boolean;
  unboundZoneNames: string[];
  onBack: () => void;
  onPreview: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  hasUnsavedChanges: boolean;
  /** The editor has no schedule or target fields, so Publish hands the saved Composition to the wizard. */
  onPublish: () => void;
  onSaveDraft: () => void;
  onSaveAsTemplate: () => void;
  onActivate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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
  const saveState = saveAction(status);
  const publishDisabledReason = !isExisting
    ? "บันทึก Layout ก่อนเผยแพร่"
    : hasUnsavedChanges
      ? "บันทึกการแก้ไขล่าสุดก่อนเผยแพร่"
      : null;

  const commitName = () => {
    onNameChange(inputRef.current?.value ?? name);
    setEditing(false);
  };
  const updatedLabel = savedAt ? `Updated ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Not saved";
  const statusColor: Record<CompositionStatus, BadgeColor> = { draft: "yellow", active: "green", inactive: "zinc" };

  return (
    <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Layouts"
          title="Back to Layouts"
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <ArrowLeftIcon />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
          {editing ? <>
            <input ref={inputRef} autoFocus defaultValue={name} maxLength={100} aria-label="Layout name" placeholder={isExisting ? "Edit Layout" : "New Layout"} onKeyDown={(event) => { if (event.key === "Enter") commitName(); if (event.key === "Escape") setEditing(false); }} className="min-w-0 flex-1 border-b border-indigo-500 bg-transparent text-2xl font-semibold text-zinc-900 outline-none dark:text-zinc-50" />
            <button type="button" onClick={commitName} aria-label="ยืนยันชื่อ Layout" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400"><CheckIcon /></button>
          </> : <>
            <h1 className="min-w-0 break-words text-2xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50">{name.trim() || "Untitled Layout"}</h1>
            <button type="button" onClick={() => setEditing(true)} aria-label="แก้ไขชื่อ Layout" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><EditIcon /></button>
          </>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="pill">{referenceResolution ?? "Custom"}</Badge>
            <Badge variant="pill">{aspectRatio}</Badge>
            <Badge variant="pill">{zoneCount} {zoneCount === 1 ? "Zone" : "Zones"}</Badge>
            <Badge variant="pill" color={savedAt ? "blue" : "zinc"}>{updatedLabel}</Badge>
            <Badge variant="pill" color={statusColor[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div role="group" aria-label="Edit history" className="flex overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <button type="button" disabled={!canUndo} onClick={onUndo} aria-label="Undo" title="Undo (Ctrl/Cmd+Z)" className="grid h-10 w-10 place-items-center border-r border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:text-zinc-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:disabled:text-zinc-600"><UndoIcon /></button>
            <button type="button" disabled={!canRedo} onClick={onRedo} aria-label="Redo" title="Redo (Ctrl/Cmd+Shift+Z)" className="grid h-10 w-10 place-items-center text-zinc-600 hover:bg-zinc-50 disabled:text-zinc-300 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:disabled:text-zinc-600"><RedoIcon /></button>
          </div>
          <Button variant="secondary" onClick={onPreview} disabled={!canPreview}><EyeIcon /> Preview</Button>
          <Button
            variant="secondary"
            onClick={onPublish}
            disabled={saving || !!publishDisabledReason}
            title={publishDisabledReason ?? undefined}
          >
            Publish →
          </Button>
          <Button variant="secondary" onClick={onSaveAsTemplate} disabled={saving || !!saveDisabledReason} title={saveDisabledReason ?? undefined}>
            Save as Template
          </Button>

          <div className="flex">
            <Button
              className={saveState.canActivate ? "rounded-r-none" : undefined}
              onClick={onSaveDraft}
              disabled={saving || !!saveDisabledReason}
              title={saveDisabledReason ?? undefined}
            >
              {saving ? "กำลังบันทึก..." : saveState.label}
            </Button>
            {saveState.canActivate && <details
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
                <MenuItem label="Save & Activate" reason={activateDisabledReason} disabled={saving} onSelect={onActivate} />
              </div>
            </details>}
          </div>
      </div>
    </div>
  );
}
