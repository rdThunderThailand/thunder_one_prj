import type { ContentFolder } from "@/types/domain";

export function foldersByParent(folders: readonly ContentFolder[]): ReadonlyMap<string | null, readonly ContentFolder[]> {
  const result = new Map<string | null, ContentFolder[]>();
  for (const folder of folders) result.set(folder.parent_id, [...(result.get(folder.parent_id) ?? []), folder]);
  for (const children of result.values()) children.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
