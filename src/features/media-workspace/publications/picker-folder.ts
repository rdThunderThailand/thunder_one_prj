import { folderSubtreeIds, foldersByParent } from "../content-library/folder-tree.ts";
import type { ContentFolder } from "../../../types/domain.ts";

/** "all", "uncategorized", or a folder id (that folder and everything nested under it). */
export type PickerFolder = string;

export function pickerFolderMatcher(
  selection: PickerFolder,
  folders: ContentFolder[]
): (folderId: string | null | undefined) => boolean {
  if (selection === "all") return () => true;
  if (selection === "uncategorized") return (folderId) => folderId == null;
  const subtree = folderSubtreeIds(folders, selection);
  return (folderId) => folderId != null && subtree.has(folderId);
}

/** Row count per selection key, subtree-inclusive — the numbers beside the Category rows. */
export function pickerFolderCounts(
  rowFolderIds: ReadonlyArray<string | null | undefined>,
  folders: ContentFolder[]
): Record<string, number> {
  const counts: Record<string, number> = {
    all: rowFolderIds.length,
    uncategorized: rowFolderIds.filter((id) => id == null).length,
  };
  for (const folder of folders) counts[folder.id] = rowFolderIds.filter(pickerFolderMatcher(folder.id, folders)).length;
  return counts;
}

/** Depth-first, siblings by name, so nested folders render under their parent. */
export function flattenFolders(folders: ContentFolder[]): { folder: ContentFolder; depth: number }[] {
  const byParent = foldersByParent(folders);
  const out: { folder: ContentFolder; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const folder of byParent.get(parentId) ?? []) {
      out.push({ folder, depth });
      walk(folder.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}
