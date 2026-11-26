"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import { movePlaylist, permanentlyDeletePlaylist } from "@/lib/api/media-api";
import type { ContentFolder } from "@/types/domain";
import { folderPath } from "../../content-library/folder-tree";
import { IN_USE_LEAD, playlistTrashLinks } from "../../in-use/in-use-links";
import { InUseRefusal } from "../../in-use/InUseRefusal";
import { deletePlaylist, fetchPlaylistPrograms } from "../services/playlists-api";
import { describePermanentDeleteRefusal } from "../status-display";
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
  // An in-use Trash refusal stays in the dialog, with a link per blocker (ADR 0130 §4).
  const [trashError, setTrashError] = useState<ClassifiedError | null>(null);

  const submit = async () => {
    if (!action || !target) return;
    setBusy(true);
    setTrashError(null);
    try {
      if (action === "move") await movePlaylist(target.id, value || null);
      if (action === "trash") await deletePlaylist(target.id);
      if (action === "permanent-delete") {
        const result = await permanentlyDeletePlaylist(target.id);
        if (!result.deleted) {
          onError(describePermanentDeleteRefusal(result));
          return;
        }
      }
      onDone();
    } catch (err) {
      const classified = classifyApiError(err, action === "trash" ? "ลบ playlist ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" : "ทำรายการไม่สำเร็จ");
      if (action === "trash" && classified.reason === "in-use") setTrashError(classified);
      else onError(classified.message);
    } finally {
      setBusy(false);
    }
  };

  const title = action === "move" ? "Move to folder"
    : action === "trash" ? "Move to Trash?"
      : "Permanent delete?";
  const destructive = action === "trash" || action === "permanent-delete";

  return <Dialog open={action !== null && target !== null} onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
    {action === "move" && <label className="space-y-1"><span>Destination</span>
      <select autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-border px-3 py-2">
        <option value="">Uncategorized</option>
        {folders.map((folder) => <option key={folder.id} value={folder.id}>{folderPath(folders, folder.id)}</option>)}
      </select>
    </label>}
    {action === "trash" && <p>Move &ldquo;{target?.name}&rdquo; to Trash? You can restore it later. Playlists used by an active or draft publication can&rsquo;t be trashed.</p>}
    {trashError && target && (
      <InUseRefusal
        message={trashError.message}
        lead={IN_USE_LEAD.playlistTrash}
        load={() => fetchPlaylistPrograms(target.id).then(playlistTrashLinks)}
        className="mt-3 text-sm text-error"
      />
    )}
    {action === "permanent-delete" && <p>Permanently delete &ldquo;{target?.name}&rdquo;? This cannot be undone.</p>}
      <DialogFooter>
        <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
        <Button type="button" disabled={busy} onClick={() => void submit()} className={destructive ? "bg-error hover:bg-error" : ""}>
          {busy ? "กำลังทำรายการ…" : action === "move" ? "Save" : action === "trash" ? "Move to Trash" : "Permanent delete"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
