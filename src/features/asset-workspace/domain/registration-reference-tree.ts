import type { ReferenceItem } from "../services/registration-selector-contract.ts";

export interface TreeNode {
  id: string; name: string; code: string; parentId: string | null; status: string;
  /** Short tag shown on the row: "Serial" for categories, the location type for locations. */
  tag: string | null; isSerialRequired: boolean;
}

export interface ReferenceTree {
  byId: Map<string, TreeNode>;
  /** Parent id ("" = top level) → active children, sorted by name. */
  children: Map<string, TreeNode[]>;
}

/** Only Active rows can be chosen (PO 05 §4.10, locations alike). An active child of an inactive parent moves to the top level. */
export function referenceTree(rows: TreeNode[]): ReferenceTree {
  const active = rows.filter((row) => row.status === "Active")
    .map((row) => ({ ...row, id: row.id.toLowerCase(), parentId: row.parentId?.toLowerCase() ?? null }));
  const byId = new Map(active.map((row) => [row.id, row]));
  const children = new Map<string, TreeNode[]>();
  for (const row of active) {
    const key = row.parentId && byId.has(row.parentId) ? row.parentId : "";
    children.set(key, [...(children.get(key) ?? []), row]);
  }
  for (const list of children.values()) list.sort((a, b) => a.name.localeCompare(b.name));
  return { byId, children };
}

/** Ids from the top level down to `id` (inclusive). Stops on a missing or looping parent. */
export function treePath(tree: ReferenceTree, id: string | null | undefined): string[] {
  const path: string[] = [];
  let current = id ? tree.byId.get(id.toLowerCase()) : undefined;
  while (current && !path.includes(current.id)) {
    path.unshift(current.id);
    current = current.parentId ? tree.byId.get(current.parentId) : undefined;
  }
  return path;
}

/** The registration draft's reference shape; final validation still checks the id with registration options. */
export function treeReference(tree: ReferenceTree, row: TreeNode, kind: "categories" | "locations"): ReferenceItem {
  const parent = row.parentId ? tree.byId.get(row.parentId) : undefined;
  return {
    id: row.id, name: row.name, code: row.code || null, parent_id: parent?.id ?? null,
    parent: parent ? { id: parent.id, name: parent.name } : null,
    ...(kind === "categories" ? { is_serial_required: row.isSerialRequired } : { location_type: row.tag }),
  };
}

export function searchTree(tree: ReferenceTree, query: string, limit = 50): TreeNode[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  return [...tree.byId.values()]
    .filter((row) => row.name.toLocaleLowerCase().includes(needle) || row.code.toLocaleLowerCase().includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, limit);
}
