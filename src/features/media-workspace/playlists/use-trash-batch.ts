"use client";

import { useMemo, useState } from "react";
import { classifyApiError } from "@/lib/api/api-error";
import { permanentlyDeletePlaylist, restorePlaylist } from "@/lib/api/media-api";
import { deletePlaylist } from "./services/playlists-api";
import type { PlaylistListItem } from "./types";

/** Selection + Trash batch actions for PlaylistsListPage (extracted for the 300-line rule). */
export function useTrashBatch({ inTrash, trashed, reload, onError }: {
  inTrash: boolean;
  trashed: PlaylistListItem[] | null;
  reload: () => Promise<unknown>;
  onError: (message: string | null) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);
  const [emptyTrashBusy, setEmptyTrashBusy] = useState(false);
  const emptyTrashTargets = useMemo(
    () => (inTrash ? (trashed ?? []).filter((playlist) => (playlist.publication_count ?? 0) === 0) : []),
    [inTrash, trashed]
  );
  const emptyTrashLocked = inTrash ? (trashed?.length ?? 0) - emptyTrashTargets.length : 0;


  const handleEmptyTrash = async () => {
    setEmptyTrashBusy(true);
    onError(null);
    try {
      const results = await Promise.allSettled(emptyTrashTargets.map((playlist) => permanentlyDeletePlaylist(playlist.id)));
      const deleted = results.filter((result) => result.status === "fulfilled" && result.value.deleted).length;
      const skipped = emptyTrashLocked + results.filter((result) => result.status === "fulfilled" && !result.value.deleted).length;
      const failed = results.filter((result) => result.status === "rejected").length;
      await reload();
      setEmptyTrashOpen(false);
      if (skipped || failed) {
        onError(`ลบถาวรแล้ว ${deleted} playlist; ข้าม ${skipped} playlist ที่ถูกล็อก${failed ? `; ล้มเหลว ${failed} playlist` : ""}`);
      }
    } catch (err) {
      onError(classifyApiError(err, "ล้างถังขยะไม่สำเร็จ").message);
    } finally {
      setEmptyTrashBusy(false);
    }
  };

  const runBatch = async (mode: "trash" | "restore" | "delete", ids: string[]) => {
    if (!ids.length) return;
    const verb = mode === "trash" ? "Move" : mode === "restore" ? "Recover" : "Permanently delete";
    if (!window.confirm(`${verb} ${ids.length} playlist${ids.length === 1 ? "" : "s"}?${mode === "delete" ? " This cannot be undone." : ""}`)) return;
    setEmptyTrashBusy(true);
    const action = mode === "trash" ? deletePlaylist : mode === "restore" ? restorePlaylist : permanentlyDeletePlaylist;
    const results = await Promise.allSettled(ids.map((id) => action(id)));
    const failed = results.filter(
      (result) =>
        result.status === "rejected" ||
        (result.status === "fulfilled" && typeof result.value === "object" && result.value !== null && "deleted" in result.value && !result.value.deleted),
    ).length;
    setSelectedIds(new Set());
    if (failed) onError(`${failed} playlist${failed === 1 ? "" : "s"} could not be updated.`);
    await reload();
    setEmptyTrashBusy(false);
  };

  return { selectedIds, setSelectedIds, emptyTrashOpen, setEmptyTrashOpen, emptyTrashBusy, emptyTrashTargets, emptyTrashLocked, runBatch, handleEmptyTrash };
}
