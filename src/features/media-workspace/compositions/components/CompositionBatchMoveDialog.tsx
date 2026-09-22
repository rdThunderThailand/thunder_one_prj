"use client";

import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import type { ContentFolder } from "@/types/domain";
import { moveComposition } from "../services/compositions-api";

export function CompositionBatchMoveDialog({ open, ids, folders, onClose, onDone, onError }: {
  open: boolean;
  ids: string[];
  folders: ContentFolder[];
  onClose: () => void;
  onDone: () => void;
  onError: (reason: unknown) => void;
}) {
  const [folderId, setFolderId] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const results = await Promise.allSettled(ids.map((id) => moveComposition(id, folderId || null)));
      const failed = results.find((result) => result.status === "rejected");
      if (failed?.status === "rejected") throw failed.reason;
      onDone();
    } catch (reason) {
      onError(reason);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next && !busy) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {ids.length} layout{ids.length === 1 ? "" : "s"}</DialogTitle>
          <DialogDescription>Choose a destination folder for the selected layouts.</DialogDescription>
        </DialogHeader>
        <label className="space-y-1">
          <span>Destination</span>
          <select autoFocus value={folderId} onChange={(event) => setFolderId(event.target.value)} className="w-full rounded-lg border border-border px-3 py-2">
            <option value="">Uncategorized</option>
            {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
          </select>
        </label>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button disabled={busy} onClick={() => void submit()}>{busy ? "Moving…" : "Move Here"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
