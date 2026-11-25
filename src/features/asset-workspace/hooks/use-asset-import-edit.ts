"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { importChanges, importPatch, isImportPicker, type ImportCheckResult, type ImportEditResult,
  type ImportPicker, type ImportValues } from "../domain/asset-import-edit";
import type { ImportFieldKey, ImportRow } from "../domain/asset-import-types";
import { ImportApiError, type AssetImportApi } from "../services/asset-import-api";

export function useAssetImportEdit(api: AssetImportApi, batchId: string, initial: ImportRow,
  onSaved: (result: ImportEditResult) => void, onLocked: () => void, actor?: { id: string; name: string }) {
  const [base, setBase] = useState(initial);
  const [draft, setDraft] = useState<ImportValues>(initial.values);
  const [latestPicker, setLatestPicker] = useState<ImportPicker | null>(null);
  const [apply, setApply] = useState<ImportPicker | null>(null);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<ImportCheckResult | null>(null);
  const [checkError, setCheckError] = useState("");
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState<"stale" | "uncertain" | null>(null);
  const [checkRetry, setCheckRetry] = useState(0);
  const locked = useRef(false);
  const alive = useRef(true);
  const request = useRef<AbortController | null>(null);
  const changes = importChanges(base.values, draft);
  const dirty = Object.keys(changes).length > 0;

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; request.current?.abort(); };
  }, []);

  useEffect(() => {
    if (!dirty || saving || recovery) return;
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => {
      setChecking(true);
      setCheckError("");
      void api.checkRow(batchId, base.id, importChanges(base.values, draft), controller.signal)
        .then((result) => { if (!controller.signal.aborted) setCheck(result); })
        .catch(() => { if (!controller.signal.aborted) setCheckError("Couldn't check this row. Try again."); })
        .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    }, 500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [api, batchId, base, draft, dirty, saving, recovery, checkRetry]);

  function change(field: ImportFieldKey, value: string) {
    request.current?.abort();
    setChecking(false);
    setCheck(null);
    setDraft((previous) => ({ ...previous, [field]: value }));
    if (isImportPicker(field)) { setLatestPicker(field); setApply(null); }
    if (!recovery) setError("");
  }

  function reset() {
    request.current?.abort();
    setDraft(base.values);
    setApply(null);
    setLatestPicker(null);
    setCheck(null);
    setChecking(false);
  }

  async function reload(discard = true) {
    if (locked.current) return;
    locked.current = true;
    setSaving(true);
    try {
      // A whole-number search matches the row number, so this reads only this row.
      const page = await api.listRows(batchId, { page: 1, pageSize: 100, q: String(base.rowIndex) });
      const row = page.rows.find((row) => row.id === base.id);
      if (!row) throw new Error("This row is no longer available.");
      if (!alive.current) return;
      if (!discard && row.version !== base.version) {
        setRecovery("stale");
        setError("This row changed. Reload to see the latest.");
        return;
      }
      setBase(row);
      if (discard) { setDraft(row.values); setApply(null); setLatestPicker(null); setCheck(null); }
      setRecovery(null);
      setError(discard ? "" : "The row was re-read. Review your changes before saving again.");
    } catch {
      if (alive.current) setError("Couldn't reload this row. Your changes are still here. Try again.");
    } finally {
      locked.current = false;
      if (alive.current) setSaving(false);
    }
  }

  async function save(): Promise<ImportEditResult | null> {
    if (locked.current || !dirty || recovery) return null;
    locked.current = true;
    request.current?.abort();
    setChecking(false);
    setSaving(true);
    setError("");
    try {
      const saved = await api.saveRow(batchId, base.id, importPatch(base, draft, apply));
      if (!alive.current) return null;
      const result = { ...saved, row: { ...saved.row, originalRowIndex: base.originalRowIndex,
        editedBy: actor ?? base.editedBy }, affectedRows: saved.affectedRows.map((row) => ({
          ...row, ...(row.editedAt && actor ? { editedBy: actor } : {}),
        })) };
      setBase(result.row);
      setDraft(result.row.values);
      setCheck(null);
      setApply(null);
      setLatestPicker(null);
      onSaved(result);
      toast.success(result.affectedRows.length ? `Row saved · ${result.affectedRows.length} other rows updated` : "Row saved");
      return result;
    } catch (failure) {
      if (!alive.current) return null;
      const code = failure instanceof ImportApiError ? failure.code : "CONNECTION_FAILED";
      if (code === "STALE") {
        setRecovery("stale");
        setError("This row changed. Reload to see the latest.");
      } else if (code === "INVALID_STATE") {
        toast.error("This import can no longer be edited.");
        onLocked();
      } else if (code === "PERMISSION_DENIED" || code === "NOT_FOUND") {
        setError(code === "NOT_FOUND" ? "This row is no longer available." : "You don't have permission to edit this import.");
        setRecovery("stale");
      } else {
        const uncertain = !(failure instanceof ImportApiError) || failure.status === 0 || failure.status >= 500;
        setRecovery(uncertain ? "uncertain" : null);
        setError(`Couldn't save row ${base.rowIndex}. Your changes are still here.${uncertain ? " Re-read the row before saving again." : ""}`);
        queueMicrotask(() => document.querySelector<HTMLElement>('[data-import-edit] [aria-invalid="true"]')?.focus());
      }
      return null;
    } finally {
      locked.current = false;
      if (alive.current) setSaving(false);
    }
  }

  return { base, draft, dirty, changes, latestPicker, apply, setApply, saving, checking,
    messages: check?.messages ?? base.messages, checkError, retryCheck: () => setCheckRetry((value) => value + 1),
    error, recovery, reload, change, reset, save };
}
