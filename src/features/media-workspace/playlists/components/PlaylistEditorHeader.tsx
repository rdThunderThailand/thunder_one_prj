"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckIcon, EditIcon, RedoIcon, UndoIcon } from "@/components/ui/icons";

/** The editor's title bar: editable name, save state, preview, and the Publication-wizard handoff. */
export function PlaylistEditorHeader({
  name,
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
  publishDisabledReason,
  onSave,
}: {
  name: string;
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
  onPublish: () => void;
  publishDisabledReason: string | null;
  onSave: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayName = name.trim() || "Untitled Playlist";
  const isUnsaved = savedLabel.includes("unsaved") || savedLabel.includes("not saved");
  const commitName = () => {
    onName(inputRef.current?.value ?? name);
    setEditing(false);
  };

  return (
    <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {editing ? (
            <>
              <input
                ref={inputRef}
                autoFocus
                defaultValue={name}
                onKeyDown={(event) => {
                  if (event.key === "Enter") commitName();
                  if (event.key === "Escape") setEditing(false);
                }}
                placeholder="Untitled Playlist"
                maxLength={100}
                className="min-w-0 flex-1 border-b border-primary bg-transparent text-2xl font-semibold text-foreground outline-none"
              />
              <button
                type="button"
                onClick={commitName}
                aria-label="ยืนยันชื่อ Playlist"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary-soft"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <h1 className="min-w-0 break-words text-2xl font-semibold leading-tight text-foreground">
                {displayName}
              </h1>
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
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span
            className={`rounded-full px-2.5 py-1 font-medium ${
              isUnsaved
                ? "bg-warning-soft text-warning"
                : "bg-success-soft text-success"
            }`}
          >
            {savedLabel}
          </span>
          <span>Updated {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : "—"}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="ย้อนกลับ (⌘Z)"
          title="ย้อนกลับ (⌘Z)"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <UndoIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="ทำซ้ำ (⇧⌘Z)"
          title="ทำซ้ำ (⇧⌘Z)"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <RedoIcon className="h-4 w-4" />
        </button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button
          variant="secondary"
          onClick={onPreview}
          disabled={!hasItems}
          title={!hasItems ? "เพิ่ม media ก่อนดู preview" : undefined}
        >
          Preview
        </Button>
        <Button
          variant="secondary"
          onClick={onPublish}
          disabled={saving || !!publishDisabledReason}
          title={publishDisabledReason ?? undefined}
        >
          Publish →
        </Button>
        <Button onClick={onSave} disabled={saving || name.trim() === ""}>
          {saving ? "กำลังบันทึก..." : "Save Draft"}
        </Button>
      </div>
    </div>
  );
}
