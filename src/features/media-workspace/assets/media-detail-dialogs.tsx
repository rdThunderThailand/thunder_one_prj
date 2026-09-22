"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Folder, Search } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { cn } from "@/lib/utils";
import { classifyApiError } from "@/lib/api/api-error";
import { moveMediaAsset, restoreMediaAsset, trashMediaAsset } from "@/lib/api/media-api";
import type { ContentFolder, MediaAsset } from "@/types/domain";
import { folderPath } from "../content-library/folder-tree";
import { MediaPreview, assetLabel } from "./media-detail-preview";

type DialogProps = { asset: MediaAsset; open: boolean; onOpenChange: (open: boolean) => void };

export function MoveToFolderDialog({
  asset,
  folders,
  open,
  onOpenChange,
  onMoved,
  thumbnailUrl,
}: DialogProps & { folders: ContentFolder[]; onMoved: (folderId: string | null) => void; thumbnailUrl?: string }) {
  const [query, setQuery] = useState("");
  const [destination, setDestination] = useState<string | null | undefined>(undefined);
  const [isMoving, setIsMoving] = useState(false);
  const list = useMemo(() => {
    const options: Array<{ id: string | null; name: string }> = [{ id: null, name: "Uncategorized" }, ...folders.map((folder) => ({ id: folder.id, name: folderPath(folders, folder.id) }))];
    return options.filter((option) => option.name.toLowerCase().includes(query.toLowerCase()));
  }, [folders, query]);
  const current = asset.folder_id ?? null;
  const move = async () => {
    if (destination === undefined) return;
    setIsMoving(true);
    try {
      await moveMediaAsset(asset.id, destination);
      onMoved(destination);
      onOpenChange(false);
      toast.success("Media moved", { description: `${assetLabel(asset)} is now in ${folderPath(folders, destination)}.` });
    } catch (reason) {
      toast.error(classifyApiError(reason, "Unable to move media").message);
    } finally {
      setIsMoving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Move to Folder</DialogTitle>
          <DialogDescription>Choose a destination folder for this media item.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_240px]">
          <div className="rounded-lg border border-border">
            <div className="flex items-center gap-2 border-b border-border p-2">
              <label className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search folders..." className="h-8 pl-8 text-[11px]" />
              </label>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {list.map((option) => (
                <button
                  key={option.id ?? "root"}
                  type="button"
                  onClick={() => setDestination(option.id)}
                  className={cn(
                    "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[11px] font-medium",
                    destination === option.id ? "bg-primary-soft text-primary" : "hover:bg-muted",
                  )}
                >
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <Folder className="h-3.5 w-3.5" />
                  {option.name}
                </button>
              ))}
              {!list.length && <p className="p-2 text-[11px] text-muted-foreground">No folders match your search.</p>}
            </div>
          </div>
          <div className="space-y-3 rounded-lg border border-border p-3 text-[11px]">
            <div className="flex items-center gap-2">
              <div className="w-16 overflow-hidden rounded border border-border">
                <MediaPreview asset={asset} thumbnailUrl={thumbnailUrl} />
              </div>
              <strong className="min-w-0 truncate">{assetLabel(asset)}</strong>
            </div>
            <div>
              <p className="text-muted-foreground">Current Location</p>
              <strong>{folderPath(folders, current)}</strong>
            </div>
            <div>
              <p className="text-muted-foreground">Selected Destination</p>
              <strong>{destination === undefined ? "—" : folderPath(folders, destination)}</strong>
            </div>
            <p className="text-[10px] text-muted-foreground">All existing usage will remain unchanged.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={destination === undefined || destination === current || isMoving} onClick={() => void move()}>
            Move to Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TrashDialog({ asset, open, onOpenChange }: DialogProps) {
  const router = useRouter();
  const label = assetLabel(asset);
  const trash = async () => {
    try {
      await trashMediaAsset(asset.id);
    } catch (reason) {
      toast.error(classifyApiError(reason, "Unable to move media to Trash").message);
      return;
    }
    onOpenChange(false);
    router.push("/media-workspace/assets");
    toast.success(`${label} moved to Trash`, {
      description: "The file can be restored later.",
      action: {
        label: "Undo",
        onClick: () => {
          void restoreMediaAsset(asset.id)
            .then(() => toast.success("Media restored", { description: `${label} is back in the library.` }))
            .catch((reason) => toast.error(classifyApiError(reason, "Unable to restore media").message));
        },
      },
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Move to Trash?</DialogTitle>
          <DialogDescription>{label} will be moved to Trash and can be restored later.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void trash()}>
            Move to Trash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FullscreenDialog({ asset, open, onOpenChange, previewUrl, thumbnailUrl }: DialogProps & { previewUrl?: string; thumbnailUrl?: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="truncate">{assetLabel(asset)}</DialogTitle>
          <DialogDescription>Fullscreen preview</DialogDescription>
        </DialogHeader>
        <div className="overflow-hidden rounded-lg border border-border">
          <MediaPreview asset={asset} previewUrl={previewUrl} thumbnailUrl={thumbnailUrl} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
