"use client";

import { useMemo, useState } from "react";
import { Folder } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
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
type DeleteFolderItems = {
  loadIds: (folderId: string) => Promise<string[]>;
  move: (itemId: string, folderId: string | null) => Promise<void>;
};

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
  deleteFolderItems,
  isLoading = false,
  createOpen: controlledCreateOpen,
  onCreateOpenChange,
}: {
  scope: FolderScope;
  labels: { all: string; uncategorized: string; trash: string };
  folders: ContentFolder[];
  selected: FolderCollection;
  counts?: Record<string, number>;
  deleteFolderItems?: DeleteFolderItems;
  isLoading?: boolean;
  /** Pass both to open the Create Folder modal from outside (e.g. a page-header button);
   *  the rail then renders no footer button of its own. */
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
  onSelect: (collection: FolderCollection) => void;
  onRefresh: () => void;
  onError: (error: unknown) => void;
}) {
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const isCreateControlled = controlledCreateOpen !== undefined;
  const createOpen = isCreateControlled ? controlledCreateOpen : internalCreateOpen;
  const setCreateOpen = isCreateControlled ? (onCreateOpenChange ?? (() => {})) : setInternalCreateOpen;
  const [action, setAction] = useState<FolderAction | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteItemIds, setDeleteItemIds] = useState<string[] | null>(null);
  const [deleteDestination, setDeleteDestination] = useState<"uncategorized" | "folder">("uncategorized");
  const selectedFolderId = selected !== "all" && selected !== "uncategorized" && selected !== "trash" ? selected : null;
  const moveTargets = useMemo(() => action && (action.kind === "move" || action.kind === "delete")
    ? folders.filter((folder) => folder.id !== action.folder.id && !isDescendant(folders, action.folder.id, folder.id))
    : [], [action, folders]);
  const childFolders = action?.kind === "delete"
    ? folders.filter((folder) => folder.parent_id === action.folder.id)
    : [];

  const close = () => { setCreateOpen(false); setAction(null); setValue(""); setDeleteItemIds(null); };
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
    if (action.kind === "delete" && childFolders.length === 0) void run(async () => {
      try {
        if (deleteFolderItems && deleteItemIds?.length) {
          const destinationId = deleteDestination === "folder" ? value : null;
          for (const itemId of deleteItemIds) await deleteFolderItems.move(itemId, destinationId);
        }
      } catch (error) {
        onRefresh();
        throw error;
      }
      await deleteContentFolder(action.folder.id);
      if (selected === action.folder.id) onSelect("all");
    });
  };
  const openAction = (kind: FolderAction["kind"], folder: ContentFolder) => {
    setAction({ kind, folder });
    setValue(kind === "rename" ? folder.name : "");
    setDeleteDestination("uncategorized");
    if (kind === "delete" && deleteFolderItems) {
      setDeleteItemIds(null);
      void deleteFolderItems.loadIds(folder.id).then(setDeleteItemIds).catch((error) => {
        setAction(null);
        onError(error);
      });
    }
  };

  const deletingItems = action?.kind === "delete" && (deleteItemIds?.length ?? 0) > 0;
  const deleteDisabled = action?.kind === "delete" && (childFolders.length > 0 || (!!deleteFolderItems
    && (deleteItemIds === null || (deletingItems && deleteDestination === "folder" && !value))));

  return <>
    <ContentFolderRail folders={folders} selected={selected} labels={labels} counts={counts} onSelect={onSelect} onRename={(folder) => openAction("rename", folder)} onMove={(folder) => openAction("move", folder)} onDelete={(folder) => openAction("delete", folder)} isLoading={isLoading} footer={isCreateControlled ? undefined : <Button variant="outline" size="sm" className="w-full" onClick={() => { setValue(""); setCreateOpen(true); }}><Folder className="h-3.5 w-3" />Create Folder</Button>} />
    <Dialog open={createOpen} onOpenChange={(open) => { if (!open && !busy) close(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Folder</DialogTitle></DialogHeader>
      <label className="space-y-1"><span>Folder name</span><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-border px-3 py-2" /></label>
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancel</Button><Button type="button" disabled={busy || !value.trim()} onClick={() => void create()}>{busy ? "Creating…" : "Create"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={action !== null} onOpenChange={(open) => { if (!open && !busy) close(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{action?.kind === "rename" ? "Rename Folder" : action?.kind === "move" ? "Move Folder" : `Delete “${action?.folder.name ?? "Folder"}”?`}</DialogTitle></DialogHeader>
      {action?.kind === "rename" && <label className="space-y-1"><span>Folder name</span><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-border px-3 py-2" /></label>}
      {action?.kind === "move" && <label className="space-y-1"><span>Parent folder</span><select autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="w-full rounded-lg border border-border px-3 py-2"><option value="">Root</option>{moveTargets.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>}
      {action?.kind === "delete" && childFolders.length > 0 && <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8"><path d="M3.5 6.5h6l2 2h9v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><circle cx="17.5" cy="17.5" r="3.5" fill="white"/><path d="M17.5 15.7v2.1m0 1.3v.1"/></svg>
        </span>
        <div className="pt-0.5 text-sm text-muted-foreground"><p className="font-medium text-foreground">This folder contains {childFolders.length} child folder{childFolders.length === 1 ? "" : "s"}.</p><p>Move or delete the child {childFolders.length === 1 ? "folder" : "folders"} before deleting this folder.</p></div>
      </div>}
      {action?.kind === "delete" && childFolders.length === 0 && !deleteFolderItems && <p>Delete &ldquo;{action.folder.name}&rdquo;? The backend refuses non-empty Folders.</p>}
      {action?.kind === "delete" && childFolders.length === 0 && deleteFolderItems && <div className="space-y-5">
        <div className="flex items-start gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${deletingItems ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8"><path d="M3.5 6.5h6l2 2h9v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><circle cx="17.5" cy="17.5" r="3.5" fill="white"/><path d="m16 17.5 1 1 2-2"/></svg>
          </span>
          <div className="min-w-0 pt-0.5 text-sm text-muted-foreground">
            {deleteItemIds === null && deleteFolderItems ? <p>Checking folder contents…</p> : deletingItems ? <><p>This folder contains {deleteItemIds?.length} layout{deleteItemIds?.length === 1 ? "" : "s"}.</p><p>What would you like to do with them?</p></> : <><p className="font-medium text-foreground">This folder is empty.</p><p>Are you sure you want to delete it?</p></>}
          </div>
        </div>
        {deletingItems && <fieldset className="space-y-3 text-sm">
          <label className="flex cursor-pointer items-start gap-2.5"><input type="radio" name="delete-destination" checked={deleteDestination === "uncategorized"} onChange={() => { setDeleteDestination("uncategorized"); setValue(""); }} className="mt-0.5"/><span><span className="block font-medium text-foreground">Move layouts to &ldquo;Uncategorized&rdquo;</span><span className="text-xs text-muted-foreground">Layouts will be moved to Uncategorized.</span></span></label>
          <label className="flex cursor-pointer items-start gap-2.5"><input type="radio" name="delete-destination" checked={deleteDestination === "folder"} onChange={() => setDeleteDestination("folder")} className="mt-0.5"/><span className="font-medium text-foreground">Move layouts to another folder</span></label>
          <select aria-label="Destination folder" disabled={deleteDestination !== "folder"} value={value} onChange={(event) => setValue(event.target.value)} className="ml-6 w-[calc(100%-1.5rem)] rounded-lg border border-border px-3 py-2 disabled:bg-muted disabled:text-muted-foreground"><option value="">Select a folder</option>{moveTargets.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
        </fieldset>}
      </div>}
        <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={close}>Cancel</Button><Button type="button" disabled={busy || deleteDisabled || (action?.kind === "rename" && !value.trim())} onClick={submitAction} className={action?.kind === "delete" ? "bg-danger hover:bg-danger disabled:bg-danger/40" : ""}>{busy ? "Saving…" : action?.kind === "delete" ? "Delete Folder" : "Save"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </>;
}
