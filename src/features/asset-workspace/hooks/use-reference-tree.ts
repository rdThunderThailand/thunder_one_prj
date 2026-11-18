import { useEffect, useState } from "react";
import { referenceTree, type ReferenceTree, type ReferenceTreeKind, type TreeNode } from "../domain/registration-reference-tree";
import { getCategories } from "../services/asset-categories-api";
import { getRegistrationLocations } from "../services/registration-location-tree";
import { getRegistrationOrgUnits } from "../services/registration-org-unit-tree";

async function loadRows(context: string, kind: ReferenceTreeKind, signal: AbortSignal): Promise<TreeNode[] | null> {
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

/** Whole active tree for a registration picker. "failed" → the step falls back to the registration options select. */
export function useReferenceTree(context: string, kind: ReferenceTreeKind) {
  const [result, setResult] = useState<{ context: string; kind: ReferenceTreeKind; tree: ReferenceTree | "failed" } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void loadRows(context, kind, controller.signal).then((rows) => {
      if (!controller.signal.aborted) setResult({ context, kind, tree: rows ? referenceTree(rows) : "failed" });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ context, kind, tree: "failed" });
    });
    return () => controller.abort();
  }, [context, kind]);
  return result?.context === context && result.kind === kind ? result.tree : null;
}
