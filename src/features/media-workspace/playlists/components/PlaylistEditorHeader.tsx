"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckIcon, EditIcon } from "@/components/ui/icons";

/** The editor's title bar: editable name (Figma H1), the save-state line, and the only
 *  controls the page carries — no Publish (ADR 0060 §3). */
export function PlaylistEditorHeader({
  name,
  savedLabel,
  lastUpdatedAt,
  hasItems,
  saving,
  onName,
  onCancel,
  onPreview,
  onSave,
}: {
  name: string;
  savedLabel: string;
  lastUpdatedAt: Date | null;
  hasItems: boolean;
  saving: boolean;
  onName: (name: string) => void;
  onCancel: () => void;
  onPreview: () => void;
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
                className="min-w-0 flex-1 border-b border-indigo-500 bg-transparent text-2xl font-semibold text-zinc-900 outline-none dark:text-zinc-50"
              />
              <button
                type="button"
                onClick={commitName}
                aria-label="ยืนยันชื่อ Playlist"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
              >
                <CheckIcon className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <h1 className="min-w-0 break-words text-2xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
                {displayName}
              </h1>
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label="แก้ไขชื่อ Playlist"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <EditIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span
            className={`rounded-full px-2.5 py-1 font-medium ${
              isUnsaved
                ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
            }`}
          >
            {savedLabel}
          </span>
          <span>Updated {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : "—"}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button
          variant="secondary"
          onClick={onPreview}
          disabled={!hasItems}
          title={!hasItems ? "เพิ่ม media ก่อนดู preview" : undefined}
        >
          Preview
        </Button>
        <Button onClick={onSave} disabled={saving || name.trim() === ""}>
          {saving ? "กำลังบันทึก..." : "Save Draft"}
        </Button>
      </div>
    </div>
  );
}
