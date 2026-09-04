"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ContentFolder } from "@/types/domain";

export function FolderActionModal({
  action,
  value,
  busy,
  moveTargets,
  onValueChange,
  onCancel,
  onSubmit,
}: {
  action: { kind: "rename" | "move"; folder: ContentFolder } | null;
  value: string;
  busy: boolean;
  moveTargets: ContentFolder[];
  onValueChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const disabled = busy || (action?.kind === "rename" && !value.trim());
  return (
    <Modal
      open={action !== null}
      onClose={onCancel}
      title={action?.kind === "rename" ? "Rename Folder" : "Move Folder"}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button disabled={disabled} onClick={onSubmit}>{busy ? "Saving…" : "Save"}</Button>
        </>
      }
    >
      {action?.kind === "rename" ? (
        <label className="space-y-1">
          <span>Folder name</span>
          <input
            autoFocus
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      ) : (
        <label className="space-y-1">
          <span>Parent folder</span>
          <select
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Root</option>
            {moveTargets.map((folder) => (
              <option key={folder.id} value={folder.id}>{folder.name}</option>
            ))}
          </select>
        </label>
      )}
    </Modal>
  );
}
