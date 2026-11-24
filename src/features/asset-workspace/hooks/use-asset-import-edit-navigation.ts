"use client";

import { useEffect, useState } from "react";
import type { ImportEditResult } from "../domain/asset-import-edit";
import type { ImportRow } from "../domain/asset-import-types";
import type { KeptRead } from "../services/keep-read";

export function useAssetImportEditNavigation(kept: KeptRead<ImportRow[]>, initial: ImportRow) {
  const [rows, setRows] = useState<ImportRow[]>(() => kept.get() ?? []);
  const [selected, setSelected] = useState(initial);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState(() => kept.get() ? 0 : -1);
  const loading = loaded !== version;
  useEffect(() => {
    let active = true;
    void kept.load().then((rows) => {
      if (active) { setRows(rows); setLoaded(version); setError(""); }
    }).catch(() => {
      if (active) { setError("Couldn't load the other rows. Try again."); setLoaded(version); }
    });
    return () => { active = false; };
  }, [kept, version]);
  const index = rows.findIndex((row) => row.id === selected.id);
  function replace(result: ImportEditResult) {
    const updated = new Map([result.row, ...result.affectedRows].map((row) => [row.id, row]));
    const next = rows.map((row) => {
      const patch = updated.get(row.id);
      return patch ? { ...row, ...patch, originalRowIndex: row.originalRowIndex,
        editedBy: patch.editedBy ?? row.editedBy } : row;
    });
    kept.set(next);
    setRows(next);
    setSelected(result.row);
    return next;
  }
  function nextIssue(result: ImportEditResult, next: ImportRow[]) {
    const index = next.findIndex((row) => row.id === result.row.id);
    return [...next.slice(index + 1), ...next.slice(0, index + 1)].find((row) => row.severity !== "valid");
  }
  return { rows, selected, setSelected, loading, error, replace, nextIssue,
    reload: () => { kept.clear(); setVersion((value) => value + 1); },
    position: { index: index + 1, total: rows.length },
    previous: !loading && index > 0 ? rows[index - 1] : null,
    next: !loading && index >= 0 ? rows[index + 1] ?? null : null };
}
