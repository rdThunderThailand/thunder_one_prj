"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { classifyApiError } from "@/lib/api/api-error";
import { movePlaylist, permanentlyDeletePlaylist } from "@/lib/api/media-api";
import type { ContentFolder } from "@/types/domain";
import { folderPath } from "../../content-library/folder-tree";
import { deletePlaylist } from "../services/playlists-api";
import { describeDeleteError } from "../status-display";
import type { PlaylistListItem } from "../types";

/** Row actions that need a confirm step or an input — `restore` is handled immediately
 *  by the page, so it is not here. */
export type PlaylistDialogAction = "move" | "trash" | "permanent-delete";

export function PlaylistsListDialogs({
  action,
  target,
  folders,
  onClose,
  onDone,
  onError,
}: {
  action: PlaylistDialogAction | null;
  target: PlaylistListItem | null;
  folders: ContentFolder[];
  onClose: () => void;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  // Parent remounts this component per (action, target) via `key`, so the initializer
  // runs fresh each time — no effect needed to sync the folder <select>.
  const [value, setValue] = useState(action === "move" ? target?.folder_id ?? "" : "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!action || !target) return;
    setBusy(true);
    try {
      if (action === "move") await movePlaylist(target.id, value || null);
      if (action === "trash") await deletePlaylist(target.id);
      if (action === "permanent-delete") {
        const result = await permanentlyDeletePlaylist(target.id);
        if (!result.deleted) {
          onError("ลบถาวรไม่ได้ — playlist นี้เคยถูก publish จึงถูกล็อกไว้ถาวร");
          return;
        }
      }
      onDone();
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      onError(action === "trash" ? describeDeleteError(raw) : classifyApiError(err, "ทำรายการไม่สำเร็จ").message);
    } finally {
      setBusy(false);
    }
  };

  const title = action === "move" ? "Move to folder"
    : action === "trash" ? "Move to Trash?"
      : "Delete permanently?";
  const destructive = action === "trash" || action === "permanent-delete";

  return <Modal open={action !== null && target !== null} onClose={onClose} title={title} footer={<>
    <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
    <Button type="button" disabled={busy} onClick={() => void submit()} className={destructive ? "bg-red-600 hover:bg-red-500" : ""}>
      {busy ? "กำลังทำรายการ…" : action === "move" ? "Save" : action === "trash" ? "Move to Trash" : "Delete permanently"}
    </Button>
  </>}>
    {action === "move" && <label className="space-y-1"><span>Destination</span>
      <select autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
        <option value="">Uncategorized</option>
        {folders.map((folder) => <option key={folder.id} value={folder.id}>{folderPath(folders, folder.id)}</option>)}
      </select>
    </label>}
    {action === "trash" && <p>Move &ldquo;{target?.name}&rdquo; to Trash? You can restore it later. Playlists used by an active or draft publication can&rsquo;t be trashed.</p>}
    {action === "permanent-delete" && <p>Permanently delete &ldquo;{target?.name}&rdquo;? This cannot be undone.</p>}
  </Modal>;
}
