"use client";

import { useEffect, useState } from "react";
import type { ImportEditResult } from "../domain/asset-import-edit";
import type { ImportRow } from "../domain/asset-import-types";
import type { AssetImportApi } from "../services/asset-import-api";
import { readAllImportRows } from "../services/asset-import-edit";

export function useAssetImportEditNavigation(api: AssetImportApi, batchId: string, initial: ImportRow) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [selected, setSelected] = useState(initial);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState(-1);
  const loading = loaded !== version;
  useEffect(() => {
    const controller = new AbortController();
    void readAllImportRows(api, batchId, controller.signal).then((rows) => {
      if (!controller.signal.aborted) { setRows(rows); setLoaded(version); setError(""); }
    }).catch(() => {
      if (!controller.signal.aborted) { setError("Couldn't load the other rows. Try again."); setLoaded(version); }
    });
    return () => controller.abort();
  }, [api, batchId, version]);
  const index = rows.findIndex((row) => row.id === selected.id);
  function replace(result: ImportEditResult) {
    const updated = new Map([result.row, ...result.affectedRows].map((row) => [row.id, row]));
    const next = rows.map((row) => {
      const patch = updated.get(row.id);
      return patch ? { ...row, ...patch, originalRowIndex: row.originalRowIndex,
        editedBy: patch.editedBy ?? row.editedBy } : row;
    });
    setRows(next);
    setSelected(result.row);
    return next;
  }
  function nextIssue(result: ImportEditResult, next: ImportRow[]) {
    const index = next.findIndex((row) => row.id === result.row.id);
    return [...next.slice(index + 1), ...next.slice(0, index + 1)].find((row) => row.severity !== "valid");
  }
  return { rows, selected, setSelected, loading, error, replace, nextIssue,
    reload: () => setVersion((value) => value + 1),
    position: { index: index + 1, total: rows.length },
    previous: !loading && index > 0 ? rows[index - 1] : null,
    next: !loading && index >= 0 ? rows[index + 1] ?? null : null };
}
