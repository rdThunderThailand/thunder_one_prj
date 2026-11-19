"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { CheckIcon, EditIcon, RedoIcon, UndoIcon } from "@/components/ui/icons";
import { PublishSplitButton } from "@/features/media-workspace/publish-changes/PublishSplitButton";
import type { PublishPrep } from "@/features/media-workspace/publish-changes/PublishPrepDialog";
import { SaveSplitButton } from "@/features/media-workspace/publish-changes/SaveSplitButton";
import { useShortcutPlatform } from "@/components/layout/ShortcutPlatform";
import { shortcutAria, shortcutLabel } from "@/lib/keyboard-shortcut";

/** The editor's title bar: editable name, save state, preview, and the Publication-wizard handoff. */
export function PlaylistEditorHeader({
  name,
  status,
  savedLabel,
  lastUpdatedAt,
  hasItems,
  saving,
  canUndo,
  canRedo,
  onName,
  onUndo,
  onRedo,
  onCancel,
  onPreview,
  onPublish,
  publishPrep,
  affectedCount,
  onPublishChanges,
  onShowPrograms,
  onSave,
  onSaveDraft,
}: {
  name: string;
  status: string;
  savedLabel: string;
  lastUpdatedAt: Date | null;
  hasItems: boolean;
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onName: (name: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onCancel: () => void;
  onPreview: () => void;
  onPublish: (id?: string) => void;
  publishPrep: PublishPrep | null;
  /** Active or scheduled Programs Publish Changes would re-publish (ADR 0078). */
  affectedCount: number;
  onPublishChanges: () => void;
  onShowPrograms: () => void;
  /** Saves and, for a draft, marks it ready so the Program wizard lists it (#404). */
  onSave: (nameOverride?: string) => void;
  /** Saves without changing the draft status; offered only while the Playlist is a draft. */
  onSaveDraft: (nameOverride?: string) => void;
}) {
  // ⌘Z / ⇧⌘Z on Apple; Ctrl+Z / Ctrl+Y elsewhere (Ctrl+Shift+Z works too).
  const shortcutPlatform = useShortcutPlatform();
  const undoKeys = shortcutLabel(shortcutPlatform, "z");
  const redoKeys = shortcutPlatform === "apple" ? shortcutLabel(shortcutPlatform, "z", { shift: true }) : shortcutLabel(shortcutPlatform, "y");
  const redoAria =
    shortcutPlatform === "apple"
      ? shortcutAria(shortcutPlatform, "z", { shift: true })
      : `${shortcutAria(shortcutPlatform, "y")} ${shortcutAria(shortcutPlatform, "z", { shift: true })}`;
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayName = name.trim() || "Untitled Playlist";
  const isUnsaved = savedLabel.includes("unsaved") || savedLabel.includes("not saved");
  // Leaving the field keeps what was typed, so a Save or Publish click that blurs it sees the new
  // name (UAT A8). Enter / ✓ / Escape close the field themselves; their own blur is skipped.
  const isClosingName = useRef(false);
  const commitName = () => {
    isClosingName.current = true;
    const value = inputRef.current?.value ?? name;
    if (value !== name) onName(value);
    setEditing(false);
  };
  const cancelName = () => {
    isClosingName.current = true;
    setEditing(false);
  };

  // An empty name is "Untitled Playlist" on screen, so a disabled Save gave no hint; the save guard
  // states the reason, and the name field opens so the fix is one keystroke away.
  const saveOrAskName = (save: (nameOverride?: string) => void) => {
    const nameOverride = editing ? inputRef.current?.value : undefined;
    setEditing(!(nameOverride ?? name).trim());
    save(nameOverride);
  };
  const isDraft = status === "draft";

  return (
    <div className="min-h-[70px] shrink-0 space-y-1">
      <button
        type="button"
        onClick={onCancel}
        className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
      >
        Playlists <span aria-hidden="true">›</span> {displayName} <span aria-hidden="true">›</span> Editor
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            {editing ? (
              <>
                <input
                  ref={inputRef}
                  autoFocus
                  defaultValue={name}
                  onFocus={() => {
                    isClosingName.current = false;
                  }}
                  onBlur={() => {
                    if (!isClosingName.current) commitName();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitName();
                    if (event.key === "Escape") cancelName();
                  }}
                  placeholder="Untitled Playlist"
                  maxLength={100}
                  className="min-w-0 flex-1 border-b border-primary bg-transparent text-lg font-semibold text-foreground outline-none"
                />
                <button
                  type="button"
                  onClick={commitName}
                  aria-label="ยืนยันชื่อ Playlist"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-accent"
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <h1 className="min-w-0 break-words text-lg font-semibold leading-tight text-foreground">
                  {displayName}
                </h1>
                <StatusBadge status={status} label={status[0].toUpperCase() + status.slice(1)} />
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label="แก้ไขชื่อ Playlist"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <EditIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span
              className={`rounded-full px-2 py-0.5 font-medium ${
                isUnsaved
                  ? "bg-warning-muted text-warning"
                  : "bg-success-muted text-success"
              }`}
            >
              {savedLabel}
            </span>
            <span>Updated {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : "—"}</span>
            {affectedCount > 0 && (
              <button type="button" onClick={onShowPrograms} className="font-medium text-primary hover:underline">
                Used by {affectedCount} program{affectedCount === 1 ? "" : "s"}
              </button>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label={`ย้อนกลับ (${undoKeys})`}
          title={`ย้อนกลับ (${undoKeys})`}
          aria-keyshortcuts={shortcutAria(shortcutPlatform, "z")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <UndoIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label={`ทำซ้ำ (${redoKeys})`}
          title={`ทำซ้ำ (${redoKeys})`}
          aria-keyshortcuts={redoAria}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <RedoIcon className="h-4 w-4" />
        </button>
        <Button
          size="sm"
          variant="outline"
          onClick={onPreview}
          disabled={!hasItems}
          title={!hasItems ? "เพิ่ม media ก่อนดู preview" : undefined}
        >
          Preview
        </Button>
        <SaveSplitButton
          label={isDraft ? "Save & Activate" : "Save"}
          saving={saving}
          disabledReason={null}
          onSave={() => saveOrAskName(onSave)}
          alternate={isDraft ? { label: "Save Draft", disabledReason: null, onSelect: () => saveOrAskName(onSaveDraft) } : undefined}
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
    </div>
  );
}
