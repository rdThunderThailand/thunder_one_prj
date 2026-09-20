"use client";

import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { classifyApiError } from "@/lib/api/api-error";
import { movePlaylist } from "@/lib/api/media-api";
import type { ContentFolder } from "@/types/domain";
import { folderPath } from "../../content-library/folder-tree";
import { upsertPlaylist } from "../services/playlists-api";

export function CreatePlaylistDialog({
  open,
  folders,
  initialFolderId,
  onClose,
  onCreated,
  onError,
}: {
  open: boolean;
  folders: ContentFolder[];
  initialFolderId: string;
  onClose: () => void;
  onCreated: (playlistId: string) => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [folderId, setFolderId] = useState(initialFolderId);
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    setName("");
    setFolderId(initialFolderId);
    onClose();
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const { playlist_id } = await upsertPlaylist({ name: trimmed, status: "draft", idempotencyKey: crypto.randomUUID() });
      if (folderId) await movePlaylist(playlist_id, folderId);
      onCreated(playlist_id);
    } catch (err) {
      onError(classifyApiError(err, "สร้าง playlist ไม่สำเร็จ").message);
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Playlist</DialogTitle></DialogHeader>
      <label className="space-y-1">
        <span>Playlist name</span>
        <input
          aria-label="Playlist name"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2"
        />
      </label>
      <label className="space-y-1">
        <span>Folder</span>
        <select
          aria-label="Folder"
          value={folderId}
          onChange={(event) => setFolderId(event.target.value)}
          className="w-full rounded-lg border border-border px-3 py-2"
        >
          <option value="">Uncategorized</option>
          {folders.map((folder) => <option key={folder.id} value={folder.id}>{folderPath(folders, folder.id)}</option>)}
        </select>
      </label>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={busy} onClick={close}>Cancel</Button>
          <Button type="button" disabled={busy || !name.trim()} onClick={() => void submit()}>{busy ? "Creating…" : "Next"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
