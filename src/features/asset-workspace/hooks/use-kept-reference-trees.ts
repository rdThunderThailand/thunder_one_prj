import { useEffect, useState } from "react";
import { keepReferenceTrees } from "../services/kept-reference-trees";
import { loadReferenceRows } from "./use-reference-tree";

/** Picker lists for one open registration. The list of the next step is read while the user fills in this one. */
export function useKeptReferenceTrees(context: string, step: number) {
  const [trees] = useState(() => keepReferenceTrees((kind) => loadReferenceRows(context, kind, new AbortController().signal)));
  useEffect(() => {
    if (step === 0) void trees.load("categories");
    if (step === 1) void trees.load("locations");
  }, [trees, step]);
  return trees;
}
