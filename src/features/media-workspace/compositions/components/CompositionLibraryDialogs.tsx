"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ContentFolder } from "@/types/domain";
import type { CompositionLibraryAction } from "../library-actions";
import {
  duplicateComposition,
  fetchCompositionPrograms,
  moveComposition,
  permanentlyDeleteComposition,
  trashComposition,
  type CompositionProgramUsage,
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
  const [programs, setPrograms] = useState<CompositionProgramUsage[] | null>(null);
  const [showPrograms, setShowPrograms] = useState(false);
  const isTrashBlocked = action === "trash" && ((target?.usageCount ?? 0) > 0 || (programs?.length ?? 0) > 0);

  const submit = async () => {
    if (!action || !target) return;
    setBusy(true);
    try {
      if (action === "duplicate") await duplicateComposition(target.id, value);
      if (action === "move") await moveComposition(target.id, value || null);
      if (action === "trash") {
        const result = await trashComposition(target.id);
        if (typeof result.trashed !== "boolean") {
          onDone();
          return;
        }
        if (!result.trashed) {
          setPrograms(result.programs ?? []);
          return;
        }
      }
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
      : action === "trash" ? showPrograms ? "Programs using this layout" : isTrashBlocked ? "This layout is currently in use" : "Move layout to Trash?"
        : "Delete Layout forever?";

  const viewPrograms = async () => {
    if (!target) return;
    setBusy(true);
    try {
      setPrograms(await fetchCompositionPrograms(target.id));
      setShowPrograms(true);
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };

  if (action === "trash" && showPrograms) {
    return <Modal open={target !== null} onClose={onClose} title={title} size="lg" showCloseButton footer={<Button type="button" variant="secondary" onClick={onClose}>Close</Button>}>
      <p className="-mt-2 mb-2 text-zinc-500">This layout is used by {programs?.length ?? 0} program{programs?.length === 1 ? "" : "s"}.</p>
      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <table className="w-full text-left text-sm"><thead className="bg-zinc-50 text-xs text-zinc-500"><tr><th className="px-3 py-2 font-medium">Program name</th><th className="px-3 py-2 font-medium">Status</th><th className="px-3 py-2 font-medium">Schedule</th></tr></thead>
          <tbody>{programs?.map((program) => <tr key={program.id} className="border-t border-zinc-100"><td className="px-3 py-2 font-medium text-zinc-800"><Link href={program.status === "draft" ? `/media-workspace/publications/create?id=${program.id}` : `/media-workspace/publications/${program.id}`} onClick={onClose} className="hover:text-indigo-600 hover:underline">{program.name}</Link></td><td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${program.status === "active" ? "bg-emerald-50 text-emerald-700" : program.status === "scheduled" ? "bg-amber-50 text-amber-700" : "bg-zinc-100 text-zinc-600"}`}>{program.status[0].toUpperCase() + program.status.slice(1)}</span></td><td className="px-3 py-2 text-zinc-500">{formatProgramSchedule(program)}</td></tr>)}</tbody>
        </table>
      </div>
    </Modal>;
  }

  return <Modal open={action !== null && target !== null} onClose={onClose} title={title} hideTitle={action === "trash"} showCloseButton={action === "trash"} footer={<>
    <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancel</Button>
    {isTrashBlocked
      ? <Button type="button" disabled={busy} onClick={() => void viewPrograms()}>{busy ? "Loading…" : "View Programs"}</Button>
      : <Button type="button" disabled={busy || (action === "duplicate" && !value.trim())} onClick={() => void submit()} className={action === "trash" || action === "delete-forever" ? "bg-red-600 hover:bg-red-500" : ""}>{busy ? "Saving…" : action === "delete-forever" ? "Delete forever" : action === "trash" ? "Move to Trash" : "Save"}</Button>}
  </>}>
    {action === "duplicate" && <label className="space-y-1"><span>New name</span><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" /></label>}
    {action === "move" && <label className="space-y-1"><span>Destination</span><select autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"><option value="">Uncategorized</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>}
    {action === "trash" && <div className="space-y-3 text-center">
      <span className={`mx-auto grid h-12 w-12 place-items-center rounded-full ${isTrashBlocked ? "bg-amber-50 text-amber-500" : "bg-red-50 text-red-500"}`} aria-hidden="true">{isTrashBlocked ? <WarningIcon /> : <TrashIcon />}</span>
      <div><p className="font-semibold text-zinc-900">{isTrashBlocked ? "This layout is currently in use" : "Move layout to Trash?"}</p><p className="mt-1 text-zinc-600">{isTrashBlocked ? <>&ldquo;{target?.name}&rdquo; is used by {programs?.length ?? target?.usageCount ?? 0} program{(programs?.length ?? target?.usageCount) === 1 ? "" : "s"}.<br/>Remove or replace this layout from those programs before moving it to Trash.</> : <>&ldquo;{target?.name}&rdquo; will be moved to Trash.<br/>You can restore it later from Trash.</>}</p></div>
    </div>}
    {action === "delete-forever" && <p>This permanently deletes &ldquo;{target?.name}&rdquo; and its private unreferenced resources. Publications or immutable snapshots will block the operation.</p>}
  </Modal>;
}

function formatProgramSchedule(program: CompositionProgramUsage) {
  if (!program.startsAt && !program.endsAt) return "Not scheduled";
  const format = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  if (!program.startsAt) return `Until ${format(program.endsAt!)}`;
  if (!program.endsAt) return `From ${format(program.startsAt)}`;
  return `${format(program.startsAt)} – ${format(program.endsAt)}`;
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M9 3h6l1 4H8zM6.5 7l1 14h9l1-14M10 11v6m4-6v6"/></svg>;
}

function WarningIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 2.7 19a1.3 1.3 0 0 0 1.1 2h16.4a1.3 1.3 0 0 0 1.1-2zM12 9v5m0 3v.1"/></svg>;
}
