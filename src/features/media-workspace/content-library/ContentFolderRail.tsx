"use client";

import { TrashIcon } from "@/components/ui/icons";
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
};

const selectedClass = "bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200";
const itemClass = "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800";

export function ContentFolderRail({ folders, selected, labels, onSelect, onRename, onMove, onDelete }: Props) {
  const children = foldersByParent(folders);
  const render = (parentId: string | null, depth = 0): React.ReactNode =>
    (children.get(parentId) ?? []).map((folder) => (
      <div key={folder.id}>
        <div className="group flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelect(folder.id)}
            className={`min-w-0 flex-1 rounded-lg px-2 py-2 text-left text-sm ${selected === folder.id ? selectedClass : itemClass}`}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
          >
            <span aria-hidden>▱</span>{folder.name}
          </button>
          {onRename && onMove && onDelete && <details className="relative shrink-0">
            <summary
              aria-label={`Actions for ${folder.name}`}
              role="button"
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                const details = event.currentTarget.parentElement as HTMLDetailsElement | null;
                if (details) details.open = !details.open;
              }}
              className="cursor-pointer list-none rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
            >⋯</summary>
            <div className="absolute right-0 z-20 mt-1 w-32 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <button type="button" className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => onRename(folder)}>Rename</button>
              <button type="button" className="block w-full rounded px-2 py-1 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => onMove(folder)}>Move</button>
              <button type="button" className="block w-full rounded px-2 py-1 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => onDelete(folder)}>Delete</button>
            </div>
          </details>}
        </div>
        {render(folder.id, depth + 1)}
      </div>
    ));

  return (
    <>
      <button type="button" onClick={() => onSelect("all")} className={`w-full rounded-lg px-2 py-2 text-left text-sm ${selected === "all" ? selectedClass : itemClass}`}>{labels.all}</button>
      <button type="button" onClick={() => onSelect("uncategorized")} className={`w-full rounded-lg px-2 py-2 text-left text-sm ${selected === "uncategorized" ? selectedClass : itemClass}`}>{labels.uncategorized}</button>
      {render(null)}
      <hr className="my-3 border-zinc-200 dark:border-zinc-800" />
      <button type="button" onClick={() => onSelect("trash")} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm ${selected === "trash" ? selectedClass : itemClass}`}><TrashIcon />{labels.trash}</button>
    </>
  );
}
