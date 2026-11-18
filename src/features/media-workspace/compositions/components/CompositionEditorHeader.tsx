"use client";

// Title, the saved badge, and the five actions. Its own file since ticket 25 because ticket
// 28 owns Save / Activate / Save as Template and their disabled reasons — it should not have
// to reach into the page component to change them.

import { useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeftIcon, CheckIcon, EditIcon, EyeIcon, RedoIcon, UndoIcon } from "@/components/ui/icons";
import { PublishSplitButton } from "@/features/media-workspace/publish-changes/PublishSplitButton";
import type { PublishPrep } from "@/features/media-workspace/publish-changes/PublishPrepDialog";
import { SaveSplitButton } from "@/features/media-workspace/publish-changes/SaveSplitButton";
import { saveAction } from "../status-display";
import type { CompositionStatus } from "../types";
import { useShortcutPlatform } from "@/components/layout/ShortcutPlatform";
import { shortcutAria, shortcutLabel } from "@/lib/keyboard-shortcut";

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
  hasZoneOverlap,
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
  onSaveForPublish,
  affectedCount,
  onPublishChanges,
  onShowPrograms,
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
  /** Core refuses overlapping Zones (ADR 0044 §3), so the save is blocked here instead of failing there. */
  hasZoneOverlap: boolean;
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
  onPublish: (id?: string) => void;
  /** Saves (and with `activate`, activates) for Publish to Channel…; resolves to the id, `null` on failure. */
  onSaveForPublish: (activate: boolean) => Promise<string | null>;
  /** Active or scheduled Programs Publish Changes would re-publish (ADR 0078). */
  affectedCount: number;
  onPublishChanges: () => void;
  onShowPrograms: () => void;
  onSaveDraft: () => void;
  onSaveAsTemplate: () => void;
  onActivate: () => void;
}) {
  const shortcutPlatform = useShortcutPlatform();
  const undoKeys = shortcutLabel(shortcutPlatform, "z");
  const redoKeys = shortcutPlatform === "apple" ? shortcutLabel(shortcutPlatform, "z", { shift: true }) : shortcutLabel(shortcutPlatform, "y");
  const redoAria =
    shortcutPlatform === "apple"
      ? shortcutAria(shortcutPlatform, "z", { shift: true })
      : `${shortcutAria(shortcutPlatform, "y")} ${shortcutAria(shortcutPlatform, "z", { shift: true })}`;
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // ADR 0063 §2: `Unsaved` until the first write, `Last saved HH:MM` after. The frames'
  // "Saved just now" on a never-saved blank canvas is a claim the editor cannot make.
  // The buttons own the reasons they are off, so the page does not have to restate them.
  const saveDisabledReason = !name.trim()
    ? "กรุณากรอกชื่อ Layout"
    : !hasLayout ? "กรุณาเลือก Template หรือ Start blank"
      : hasZoneOverlap ? "แก้ Zone ที่ซ้อนทับกันก่อนบันทึก" : null;
  // ADR 0049 §10 via ADR 0063 §8: the menu item states *how many* Zones are still unbound,
  // which the frames' single button had no room to say.
  const activateDisabledReason = saveDisabledReason
    ?? (!isComplete ? `ยังไม่ได้ผูก Content ให้ ${unboundZoneNames.length} Zone: ${unboundZoneNames.join(", ")}` : null);
  const saveState = saveAction(status);
  // QA 2026-10-08 #4: only an Active Layout can air (Core refuses Draft and Inactive alike). ADR 0116 §6:
  // Publish to Channel… offers the save / activation it needs instead of a disabled item with a tooltip.
  const publishPrep: PublishPrep | null =
    status !== "active"
      ? {
          title: "Layout ต้อง Active ก่อนเผยแพร่",
          description: activateDisabledReason
            ? `ยังเปิดใช้งานไม่ได้: ${activateDisabledReason}`
            : "ระบบจะบันทึกและเปิดใช้งาน Layout นี้ แล้วพาไปสร้าง Program ต่อ",
          action: activateDisabledReason ? null : { label: "Save & Activate แล้วไปต่อ", run: () => onSaveForPublish(true) },
        }
      : hasUnsavedChanges
        ? {
            title: "มีการแก้ไขที่ยังไม่บันทึก",
            description: saveDisabledReason ?? "บันทึกการแก้ไขล่าสุดก่อน แล้วไปสร้าง Program ต่อ",
            action: saveDisabledReason ? null : { label: "Save แล้วไปต่อ", run: () => onSaveForPublish(false) },
          }
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
            <button type="button" onClick={commitName} aria-label="ยืนยันชื่อ Layout" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-accent"><CheckIcon /></button>
          </> : <>
            <h1 className="min-w-0 break-words text-sm font-bold leading-tight text-foreground">{name.trim() || "Untitled Layout"}</h1>
            <button type="button" onClick={() => setEditing(true)} aria-label="แก้ไขชื่อ Layout" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><EditIcon /></button>
          </>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant[status]} className="rounded-full px-2 py-0 text-[10px]">{status[0].toUpperCase() + status.slice(1)}</Badge>
            <span className="text-xs text-muted-foreground">{referenceResolution ?? aspectRatio} · {zoneCount} {zoneCount === 1 ? "Zone" : "Zones"} · {updatedLabel}</span>
            {affectedCount > 0 && <button type="button" onClick={onShowPrograms} className="text-xs font-medium text-primary hover:underline">Used by {affectedCount} program{affectedCount === 1 ? "" : "s"}</button>}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div role="group" aria-label="Edit history" className="flex overflow-hidden rounded-lg border border-border bg-card">
            <button type="button" disabled={!canUndo} onClick={onUndo} aria-label="Undo" title={`Undo (${undoKeys})`} aria-keyshortcuts={shortcutAria(shortcutPlatform, "z")} className="grid h-8 w-8 place-items-center border-r border-border text-muted-foreground hover:bg-muted disabled:text-muted-foreground"><UndoIcon /></button>
            <button type="button" disabled={!canRedo} onClick={onRedo} aria-label="Redo" title={`Redo (${redoKeys})`} aria-keyshortcuts={redoAria} className="grid h-8 w-8 place-items-center text-muted-foreground hover:bg-muted disabled:text-muted-foreground"><RedoIcon /></button>
          </div>
          <Button size="sm" variant="secondary" onClick={onPreview} disabled={!canPreview}><EyeIcon /> Preview</Button>
          <Button size="sm" variant="secondary" onClick={onSaveAsTemplate} disabled={saving || !!saveDisabledReason} title={saveDisabledReason ?? undefined}>
            Save as Template
          </Button>

          <SaveSplitButton
            label={saveState.label}
            saving={saving}
            disabledReason={saveDisabledReason}
            onSave={onSaveDraft}
            alternate={saveState.canActivate ? { label: "Save & Activate", disabledReason: activateDisabledReason, onSelect: onActivate } : undefined}
          />
          <PublishSplitButton
            disabled={saving}
            hasAffectedPrograms={affectedCount > 0}
            publishToChannelPrep={publishPrep}
            onPublishChanges={onPublishChanges}
            onPublishToChannel={onPublish}
          />
      </div>
    </div>
  );
}
