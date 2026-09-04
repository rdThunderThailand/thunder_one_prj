"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ContentFolderRail, type FolderCollection } from "./ContentFolderRail";
import { isDescendant } from "./folder-tree";
import {
  createContentFolder,
  deleteContentFolder,
  moveContentFolder,
  renameContentFolder,
} from "@/lib/api/media-api";
import type { ContentFolder } from "@/types/domain";

type FolderScope = "asset" | "playlist" | "composition";
type FolderAction = { kind: "rename" | "move" | "delete"; folder: ContentFolder };

/** Folder rail + CRUD modals, shared across Media Library / Layouts / Playlists — the
 *  scope and the three virtual-collection labels are the only things that differ. */
export function FeatureFolderRail({
  scope,
  labels,
  folders,
  selected,
  onSelect,
  onRefresh,
  onError,
  counts,
  isLoading = false,
}: {
  scope: FolderScope;
  labels: { all: string; uncategorized: string; trash: string };
  folders: ContentFolder[];
  selected: FolderCollection;
  counts?: Record<string, number>;
  isLoading?: boolean;
  onSelect: (collection: FolderCollection) => void;
  onRefresh: () => void;
  onError: (error: unknown) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [action, setAction] = useState<FolderAction | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedFolderId = selected !== "all" && selected !== "uncategorized" && selected !== "trash" ? selected : null;
  const moveTargets = useMemo(() => action?.kind === "move"
    ? folders.filter((folder) => folder.id !== action.folder.id && !isDescendant(folders, action.folder.id, folder.id))
    : [], [action, folders]);

  const close = () => { setCreateOpen(false); setAction(null); setValue(""); };
  const run = async (operation: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await operation();
      close();
      onRefresh();
    } catch (error) {
      onError(error);
    } finally {
      setBusy(false);
    }
  };
  const create = () => run(() => createContentFolder(scope, { name: value.trim(), parent_id: selectedFolderId }));
  const submitAction = () => {
    if (!action) return;
    if (action.kind === "rename") void run(() => renameContentFolder(action.folder.id, value.trim()));
    if (action.kind === "move") void run(() => moveContentFolder(action.folder.id, value || null));
    if (action.kind === "delete") void run(async () => {
      await deleteContentFolder(action.folder.id);
      if (selected === action.folder.id) onSelect("all");
    });
  };
  const openAction = (kind: FolderAction["kind"], folder: ContentFolder) => {
    setAction({ kind, folder });
    setValue(kind === "rename" ? folder.name : "");
  };

  return <>
    <ContentFolderRail folders={folders} selected={selected} labels={labels} counts={counts} onSelect={onSelect} onRename={(folder) => openAction("rename", folder)} onMove={(folder) => openAction("move", folder)} onDelete={(folder) => openAction("delete", folder)} isLoading={isLoading} footer={<Button type="button" variant="secondary" className="mt-2 w-full py-2" onClick={() => { setValue(""); setCreateOpen(true); }}>+ New Folder</Button>} />
    <Modal open={createOpen} onClose={close} title="Create Folder" footer={<><Button type="button" variant="secondary" disabled={busy} onClick={close}>Cancel</Button><Button type="button" disabled={busy || !value.trim()} onClick={() => void create()}>{busy ? "Creating…" : "Create"}</Button></>}>
      <label className="space-y-1"><span>Folder name</span><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" /></label>
    </Modal>
    <Modal open={action !== null} onClose={close} title={action?.kind === "rename" ? "Rename Folder" : action?.kind === "move" ? "Move Folder" : "Delete Folder?"} footer={<><Button type="button" variant="secondary" disabled={busy} onClick={close}>Cancel</Button><Button type="button" disabled={busy || (action?.kind === "rename" && !value.trim())} onClick={submitAction} className={action?.kind === "delete" ? "bg-red-600 hover:bg-red-500" : ""}>{busy ? "Saving…" : action?.kind === "delete" ? "Delete" : "Save"}</Button></>}>
      {action?.kind === "rename" && <label className="space-y-1"><span>Folder name</span><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900" /></label>}
      {action?.kind === "move" && <label className="space-y-1"><span>Parent folder</span><select autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"><option value="">Root</option>{moveTargets.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>}
      {action?.kind === "delete" && <p>Delete &ldquo;{action.folder.name}&rdquo;? The backend refuses non-empty Folders.</p>}
    </Modal>
  </>;
}
