"use client";

import { useEffect, useMemo } from "react";
import type { ImportRow } from "../domain/asset-import-types";
import type { AssetImportApi } from "../services/asset-import-api";
import { readAllImportRows } from "../services/asset-import-edit";
import { refreshRegistrationOptions } from "../services/asset-registration-client";
import type { RegistrationOptions } from "../services/asset-registration-contract";
import { keepRead, type KeptRead } from "../services/keep-read";
import { keepReferenceTrees, type KeptReferenceTrees } from "../services/kept-reference-trees";
import { fetchRegistrationReferences } from "../services/registration-selector-client";
import type { ReferenceItem } from "../services/registration-selector-contract";
import { loadReferenceRows } from "./use-reference-tree";

export interface ImportEditorResources {
  rows: KeptRead<ImportRow[]>;
  rules: KeptRead<RegistrationOptions["referenceSelectors"]>;
  trees: KeptReferenceTrees;
  /** The category or location a typed value names, or null when there is none. */
  lookup: (kind: "categories" | "locations", text: string) => Promise<ReferenceItem | null>;
  /** Cancels running reads and forgets everything. */
  stop: () => void;
}

function importEditorResources(api: AssetImportApi, batchId: string, context: string): ImportEditorResources {
  let controller = new AbortController();
  const rows = keepRead(() => readAllImportRows(api, batchId, controller.signal));
  const rules = keepRead(async () => (await refreshRegistrationOptions(context, controller.signal)).referenceSelectors);
  const trees = keepReferenceTrees((kind) => loadReferenceRows(context, kind, controller.signal));
  const lookups = new Map<string, KeptRead<ReferenceItem | null>>();
  return {
    rows, rules, trees,
    lookup: (kind, text) => {
      const target = text.trim().toLowerCase();
      const key = `${kind}:${target}`;
      let found = lookups.get(key);
      if (!found) {
        found = keepRead(async () => {
          const page = await fetchRegistrationReferences(context, { kind, q: text.trim() }, controller.signal);
          return page.items.find((item) => [item.code, item.name].some((value) => value?.trim().toLowerCase() === target)) ?? null;
        });
        lookups.set(key, found);
      }
      return found.load();
    },
    stop: () => {
      controller.abort();
      controller = new AbortController();
      rows.clear();
      rules.clear();
      trees.clear();
      lookups.clear();
    },
  };
}

/** What the row editor reads, kept while one rows table is open so the next row opens without reading it all again. */
export function useImportEditorResources(api: AssetImportApi, batchId: string, context: string): ImportEditorResources {
  const resources = useMemo(() => importEditorResources(api, batchId, context), [api, batchId, context]);
  useEffect(() => resources.stop, [resources]);
  return resources;
}
