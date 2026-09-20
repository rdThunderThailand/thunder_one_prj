"use client";

import { Button } from "@/components/ui/lovable/button";
import { Modal } from "@/components/ui/Modal";

export function CreateFolderModal({
  open,
  name,
  busy,
  onNameChange,
  onCancel,
  onCreate,
}: {
  open: boolean;
  name: string;
  busy: boolean;
  onNameChange: (value: string) => void;
  onCancel: () => void;
  onCreate: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title="Create Folder"
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button disabled={busy} onClick={onCreate}>{busy ? "Creating…" : "Create"}</Button>
        </>
      }
    >
      <label className="space-y-1">
        <span>Folder name</span>
        <input
          autoFocus
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2"
        />
      </label>
    </Modal>
  );
}
