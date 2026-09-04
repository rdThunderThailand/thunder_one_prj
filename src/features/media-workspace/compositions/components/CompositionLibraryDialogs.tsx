"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ContentFolder } from "@/types/domain";
import type { CompositionLibraryAction } from "../library-actions";
import {
  duplicateComposition,
  moveComposition,
  permanentlyDeleteComposition,
  trashComposition,
} from "../services/compositions-api";
import type { CompositionLibraryItem } from "../types";

export type CompositionDialogAction = Extract<
  CompositionLibraryAction,
  "duplicate" | "move" | "trash" | "delete-forever"
>;

export function CompositionLibraryDialogs({
  action,
  target,
  folders,
  onClose,
  onDone,
  onError,
}: {
  action: CompositionDialogAction | null;
  target: CompositionLibraryItem | null;
  folders: ContentFolder[];
  onClose: () => void;
  onDone: () => void;
  onError: (error: unknown) => void;
}) {
  // Keyed by action+target at the call site, so a fresh dialog starts from a fresh state.
  const [value, setValue] = useState(() => action === "duplicate" && target ? `${target.name} copy` : "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!action || !target) return;
    setBusy(true);
    try {
      if (action === "duplicate") await duplicateComposition(target.id, value);
      if (action === "move") await moveComposition(target.id, value || null);
      if (action === "trash") await trashComposition(target.id);
      if (action === "delete-forever") {
        const result = await permanentlyDeleteComposition(target.id);
        if (!result.deleted) throw new Error(`Delete blocked by: ${result.blockers.join(", ")}`);
      }
      onDone();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  const title = action === "duplicate" ? "Duplicate Layout"
    : action === "move" ? "Move Layout"
      : action === "trash" ? "Move Layout to Trash?"
        : "Delete Layout forever?";

  return <Modal open={action !== null && target !== null} onClose={onClose} title={title} footer={<>
    <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
    <Button type="button" disabled={busy || (action === "duplicate" && !value.trim())} onClick={() => void submit()} className={action === "trash" || action === "delete-forever" ? "bg-red-600 hover:bg-red-500" : ""}>{busy ? "Saving…" : action === "delete-forever" ? "Delete forever" : action === "trash" ? "Move to Trash" : "Save"}</Button>
  </>}>
    {action === "duplicate" && <label className="space-y-1"><span>New name</span><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" /></label>}
    {action === "move" && <label className="space-y-1"><span>Destination</span><select autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"><option value="">Uncategorized</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>}
    {action === "trash" && <p>Move &ldquo;{target?.name}&rdquo; to Trash? It is currently used in {target?.usageCount ?? 0} active, scheduled or draft Publications. Existing Publications keep their references.</p>}
    {action === "delete-forever" && <p>This permanently deletes &ldquo;{target?.name}&rdquo; and its private unreferenced resources. Publications or immutable snapshots will block the operation.</p>}
  </Modal>;
}
