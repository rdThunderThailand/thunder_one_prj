"use client";

import type { ReactNode } from "react";
import { ChevronRight, Folder, FolderOpen, MoreHorizontal, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/lovable/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/lovable/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ContentFolder } from "@/types/domain";
import { foldersByParent } from "./folder-tree";

export type FolderCollection = "all" | "uncategorized" | "trash" | string;

type Props = {
  folders: ContentFolder[];
  selected: FolderCollection;
  labels: { all: string; uncategorized: string; trash: string };
  onSelect: (id: FolderCollection) => void;
  onRename?: (folder: ContentFolder) => void;
  onMove?: (folder: ContentFolder) => void;
  onDelete?: (folder: ContentFolder) => void;
  /** Item counts by collection key ("all" | "uncategorized" | folderId). Folder counts
   *  are expected to be subtree-inclusive. Omit to render the rail without counts. */
  counts?: Record<string, number>;
  footer?: ReactNode;
  isLoading?: boolean;
};

// Lovable `FolderTree` row: 32px tall, 10px label, soft-primary when active.
const rowClass = (active: boolean) =>
  cn(
    "group flex h-8 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-[10px] font-medium",
    active ? "bg-primary-soft text-primary" : "hover:bg-muted",
  );

const countLabel = (counts: Record<string, number> | undefined, key: string) =>
  counts && key in counts ? <span className="text-[8px] text-muted-foreground">{counts[key]}</span> : null;

export function ContentFolderRail({ folders, selected, labels, onSelect, onRename, onMove, onDelete, counts, footer, isLoading = false }: Props) {
  const children = foldersByParent(folders);
  const render = (parentId: string | null, depth = 0): React.ReactNode =>
    (children.get(parentId) ?? []).map((folder) => {
      const hasChildren = (children.get(folder.id) ?? []).length > 0;
      return (
        <div key={folder.id}>
          <div className="group/row flex items-center">
            <button
              type="button"
              data-rail-item
              onClick={() => onSelect(folder.id)}
              className={cn(rowClass(selected === folder.id), "flex-1")}
              style={{ paddingLeft: `${8 + depth * 12}px` }}
            >
              <span className="w-3 shrink-0">{hasChildren && <ChevronRight className="h-3 w-3" />}</span>
              <Folder className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{folder.name}</span>
              {countLabel(counts, folder.id)}
            </button>
            {onRename && onMove && onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover/row:opacity-100 data-[state=open]:opacity-100"
                    aria-label={`Actions for ${folder.name}`}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onSelect={() => onRename(folder)}>Rename</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onMove(folder)}>Move</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDelete(folder)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {render(folder.id, depth + 1)}
        </div>
      );
    });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        <button type="button" data-rail-item onClick={() => onSelect("all")} className={rowClass(selected === "all")}>
          <span className="w-3 shrink-0" />
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{labels.all}</span>
          {countLabel(counts, "all")}
        </button>
        <button type="button" data-rail-item onClick={() => onSelect("uncategorized")} className={rowClass(selected === "uncategorized")}>
          <span className="w-3 shrink-0" />
          <Folder className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{labels.uncategorized}</span>
          {countLabel(counts, "uncategorized")}
        </button>
        {isLoading && <div className="space-y-2 px-2 py-2" aria-hidden="true">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>}
        {render(null)}
        <button type="button" data-rail-item onClick={() => onSelect("trash")} className={rowClass(selected === "trash")}>
          <span className="w-3 shrink-0" />
          <Trash2 className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{labels.trash}</span>
        </button>
      </div>
      {footer && <div className="mt-auto shrink-0 pt-3">{footer}</div>}
    </div>
  );
}
