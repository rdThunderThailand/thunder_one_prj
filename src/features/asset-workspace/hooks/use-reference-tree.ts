import { useEffect, useState } from "react";
import { referenceTree, type ReferenceTree, type ReferenceTreeKind, type TreeNode } from "../domain/registration-reference-tree";
import type { KeptReferenceTrees } from "../services/kept-reference-trees";
import { getCategories } from "../services/asset-categories-api";
import { getRegistrationLocations } from "../services/registration-location-tree";
import { getRegistrationOrgUnits } from "../services/registration-org-unit-tree";

export async function loadReferenceRows(context: string, kind: ReferenceTreeKind, signal: AbortSignal): Promise<TreeNode[] | null> {
  if (kind === "orgUnits") return getRegistrationOrgUnits(context, signal);
  if (kind === "categories") {
    const result = await getCategories(context, signal);
    return result.ok ? result.data.map((row) => ({
      id: row.id, name: row.name, code: row.code, parentId: row.parentId, status: row.status,
      isSerialRequired: row.isSerialRequired, tag: row.isSerialRequired ? "Serial" : null,
    })) : null;
  }
  const result = await getRegistrationLocations(context, signal);
  return result.ok ? result.data.map((row) => ({
    id: row.id, name: row.name?.trim() || "Unnamed location", code: "", parentId: row.parentId, status: row.status,
    isSerialRequired: false, tag: row.locationType ? row.locationType.replaceAll("_", " ") : null,
  })) : null;
}

/**
 * Whole active tree for a registration picker. "failed" → the step falls back to the registration options select.
 * `kept`: lists the page keeps while it is open; without it the list is read each time the field opens.
 */
export function useReferenceTree(context: string, kind: ReferenceTreeKind, kept?: KeptReferenceTrees) {
  const [result, setResult] = useState<{ context: string; kind: ReferenceTreeKind; tree: ReferenceTree | "failed" } | null>(() => {
    const tree = kept?.get(kind);
    return tree ? { context, kind, tree } : null;
  });
  useEffect(() => {
    const controller = new AbortController();
    const loading = kept ? kept.load(kind)
      : loadReferenceRows(context, kind, controller.signal).then((rows) => rows && referenceTree(rows));
    void loading.then((tree) => {
      if (!controller.signal.aborted) setResult({ context, kind, tree: tree ?? "failed" });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ context, kind, tree: "failed" });
    });
    return () => controller.abort();
  }, [context, kind, kept]);
  return result?.context === context && result.kind === kind ? result.tree : null;
}
