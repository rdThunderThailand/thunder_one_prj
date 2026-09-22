"use client";

// Title, the saved badge, and the five actions. Its own file since ticket 25 because ticket
// 28 owns Save / Activate / Save as Template and their disabled reasons — it should not have
// to reach into the page component to change them.

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/lovable/badge";
import { Button, buttonVariants } from "@/components/ui/lovable/button";
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
      className="rounded px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
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
  const statusVariant: Record<CompositionStatus, "warning" | "success" | "neutral"> = { draft: "warning", active: "success", inactive: "neutral" };

  return (
    <div className="flex min-h-[68px] shrink-0 flex-wrap items-center justify-between gap-3 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Layouts"
          title="Back to Layouts"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <ArrowLeftIcon />
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-[11px] text-muted-foreground">Layouts <span aria-hidden="true">›</span> {name.trim() || "Untitled Layout"}</p>
          <div className="flex min-w-0 items-center gap-2">
          {editing ? <>
            <input ref={inputRef} autoFocus defaultValue={name} maxLength={100} aria-label="Layout name" placeholder={isExisting ? "Edit Layout" : "New Layout"} onKeyDown={(event) => { if (event.key === "Enter") commitName(); if (event.key === "Escape") setEditing(false); }} className="min-w-0 flex-1 border-b border-primary bg-transparent text-sm font-bold text-foreground outline-none" />
            <button type="button" onClick={commitName} aria-label="ยืนยันชื่อ Layout" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary-soft"><CheckIcon /></button>
          </> : <>
            <h1 className="min-w-0 break-words text-sm font-bold leading-tight text-foreground">{name.trim() || "Untitled Layout"}</h1>
            <button type="button" onClick={() => setEditing(true)} aria-label="แก้ไขชื่อ Layout" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><EditIcon /></button>
          </>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant[status]} className="rounded-full px-2 py-0 text-[10px]">{status[0].toUpperCase() + status.slice(1)}</Badge>
            <span className="text-xs text-muted-foreground">{referenceResolution ?? aspectRatio} · {zoneCount} {zoneCount === 1 ? "Zone" : "Zones"} · {updatedLabel}</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div role="group" aria-label="Edit history" className="flex overflow-hidden rounded-lg border border-border bg-card">
            <button type="button" disabled={!canUndo} onClick={onUndo} aria-label="Undo" title="Undo (Ctrl/Cmd+Z)" className="grid h-8 w-8 place-items-center border-r border-border text-muted-foreground hover:bg-muted disabled:text-muted-foreground"><UndoIcon /></button>
            <button type="button" disabled={!canRedo} onClick={onRedo} aria-label="Redo" title="Redo (Ctrl/Cmd+Shift+Z)" className="grid h-8 w-8 place-items-center text-muted-foreground hover:bg-muted disabled:text-muted-foreground"><RedoIcon /></button>
          </div>
          <Button size="sm" variant="secondary" onClick={onPreview} disabled={!canPreview}><EyeIcon /> Preview</Button>
          <Button size="sm" variant="secondary" onClick={onSaveAsTemplate} disabled={saving || !!saveDisabledReason} title={saveDisabledReason ?? undefined}>
            Save as Template
          </Button>

          <div className="flex">
            <Button
              size="sm"
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
                className={`${buttonVariants({ size: "sm" })} cursor-pointer rounded-l-none border-l border-primary-foreground/25 px-2 list-none [&::-webkit-details-marker]:hidden`}
              >
                ▾
              </summary>
              <div className="absolute right-0 z-10 mt-1 flex w-56 flex-col rounded-lg border border-border bg-card p-1 shadow-lg">
                <MenuItem label="Save & Activate" reason={activateDisabledReason} disabled={saving} onSelect={onActivate} />
              </div>
            </details>}
          </div>
          <Button
            size="sm"
            onClick={onPublish}
            disabled={saving || !!publishDisabledReason}
            title={publishDisabledReason ?? undefined}
          >
            Publish →
          </Button>
      </div>
    </div>
  );
}
