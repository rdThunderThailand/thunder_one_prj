import type { ContentFolder } from "@/types/domain";

export function foldersByParent(folders: readonly ContentFolder[]): ReadonlyMap<string | null, readonly ContentFolder[]> {
  const result = new Map<string | null, ContentFolder[]>();
  for (const folder of folders) result.set(folder.parent_id, [...(result.get(folder.parent_id) ?? []), folder]);
  for (const children of result.values()) children.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

export function folderPath(folders: readonly ContentFolder[], folderId?: string | null): string {
  if (!folderId) return "Uncategorized";
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const names: string[] = [];
  let current = byId.get(folderId);
  while (current) {
    names.unshift(current.name);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return names.length ? names.join(" / ") : "Uncategorized";
}

export function isDescendant(folders: readonly ContentFolder[], ancestorId: string, candidateId: string): boolean {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  let parentId = byId.get(candidateId)?.parent_id ?? null;
  while (parentId) {
    if (parentId === ancestorId) return true;
    parentId = byId.get(parentId)?.parent_id ?? null;
  }
  return false;
}
