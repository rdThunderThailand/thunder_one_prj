import { useEffect, useState } from "react";
import { referenceTree, type ReferenceTree, type TreeNode } from "../domain/registration-reference-tree";
import { getCategories } from "../services/asset-categories-api";
import { getRegistrationLocations } from "../services/registration-location-tree";

async function loadRows(context: string, kind: "categories" | "locations", signal: AbortSignal): Promise<TreeNode[] | null> {
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
export function useReferenceTree(context: string, kind: "categories" | "locations") {
  const [tree, setTree] = useState<ReferenceTree | "failed" | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void loadRows(context, kind, controller.signal)
      .then((rows) => setTree(rows ? referenceTree(rows) : "failed"))
      .catch(() => { /* Abort only: both readers turn request failures into results. */ });
    return () => controller.abort();
  }, [context, kind]);
  return tree;
}
