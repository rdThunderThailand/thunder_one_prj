import { useEffect, useRef, useState } from "react";
import { ASSET_FILE_LIMIT, assetFilesChangeInputSchema, assetFilesFeedback, assetFilesPlan, existingFileSelections,
  validateAssetFile, type AssetFileKind, type AssetFileSelection, type FileUploadProgress, type ProfileUploadReceipt } from "../domain/asset-files-edit";
import { changeAssetFiles } from "../services/asset-files-change";
import { uploadProfileFile } from "../services/asset-profile-file-upload";
import { getAssetDetail, getAssetFiles } from "../services/asset-profile-api";
import type { AssetDetail, AssetFiles } from "../services/asset-profile-contract";

export type AssetFilesSnapshot = { asset: AssetDetail; files: AssetFiles };
export type ProfileFilePolicy = { enabled: boolean; maxBytes: number };

export function useAssetFilesEdit(context: string, initial: AssetFilesSnapshot, kind: AssetFileKind,
  policy: ProfileFilePolicy, initialRemoveId?: string) {
  const [baseline, setBaseline] = useState(initial);
  const original = kind === "photo" ? baseline.files.photos : baseline.files.documents;
  const [items, setItems] = useState(() => existingFileSelections(kind === "photo" ? initial.files.photos : initial.files.documents)
    .filter((item) => item.id !== initialRemoveId));
  const [reason, setReason] = useState("");
  const [failure, setFailure] = useState<ReturnType<typeof assetFilesFeedback> | null>(null);
  const [selectionError, setSelectionError] = useState("");
  const [phase, setPhase] = useState<"idle" | "uploading" | "saving" | "uncertain" | "success">("idle");
  const [progress, setProgress] = useState<Record<string, FileUploadProgress>>({});
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState("");
  const [latest, setLatest] = useState<AssetFilesSnapshot | null>(null);
  const receipts = useRef(new Map<string, ProfileUploadReceipt>());
  const previews = useRef(new Set<string>());
  const active = useRef(false);
  const flight = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const plan = assetFilesPlan(original, items, kind, reason);
  const busy = phase === "uploading" || phase === "saving";
  const terminal = ["INVALID_STATE", "PERMISSION_DENIED", "UNAUTHENTICATED", "NOT_FOUND"].includes(failure?.code ?? "");
  const locked = busy || reading || phase === "uncertain" || phase === "success" || terminal || baseline.asset.lifecycleStatus === "Disposed";
  const canSave = !locked && failure?.code !== "STALE" && plan.dirty && plan.valid && (!plan.additions.length || policy.enabled);
  useEffect(() => {
    active.current = true;
    const urls = previews.current;
    return () => { active.current = false; controller.current?.abort(); for (const url of urls) URL.revokeObjectURL(url); urls.clear(); };
  }, []);
  useEffect(() => {
    if (!plan.dirty && !busy && phase !== "uncertain") return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [plan.dirty, busy, phase]);

  function forget(item: AssetFileSelection) {
    if (item.previewUrl) { URL.revokeObjectURL(item.previewUrl); previews.current.delete(item.previewUrl); }
    if (!item.existing) receipts.current.delete(item.id);
  }
  function select(files: File[], replacing?: string) {
    if (locked || flight.current || !files.length) return;
    if (!policy.enabled) { setSelectionError("File uploads are unavailable. Reload upload rules before choosing files."); return; }
    const replaced = replacing ? items.find((item) => item.id === replacing) : null;
    const problem = replacing && (!replaced || files.length !== 1) ? "Choose one replacement file."
      : files.map((file) => validateAssetFile(file, kind, policy.maxBytes)).find(Boolean)
        || (items.length - (replaced ? 1 : 0) + files.length > ASSET_FILE_LIMIT[kind] ? `Keep at most ${ASSET_FILE_LIMIT[kind]} ${kind === "photo" ? "photos" : "documents"}.` : null);
    if (problem) { setSelectionError(problem); return; }
    const additions = files.map((file): AssetFileSelection => {
      const previewUrl = kind === "photo" ? URL.createObjectURL(file) : null;
      if (previewUrl) previews.current.add(previewUrl);
      return { id: crypto.randomUUID(), existing: null, file, previewUrl };
    });
    if (replaced) forget(replaced);
    setItems([...items.filter((item) => item.id !== replacing), ...additions]);
    setSelectionError("");
  }
  function remove(id: string) {
    if (locked || flight.current) return;
    const item = items.find((entry) => entry.id === id);
    if (item) forget(item);
    setItems(items.filter((entry) => entry.id !== id));
    setSelectionError("");
    if (failure?.code !== "STALE") setFailure(null);
  }
  function restore(id: string) {
    if (locked || flight.current || items.length >= ASSET_FILE_LIMIT[kind]) return;
    const file = original.find((entry) => entry.fileId === id);
    if (!file || items.some((entry) => entry.id === id)) return;
    const existing = new Set(items.filter((entry) => entry.existing).map((entry) => entry.id));
    existing.add(id);
    setItems([...existingFileSelections(original.filter((entry) => existing.has(entry.fileId))), ...items.filter((entry) => !entry.existing)]);
  }
  async function save() {
    if (!canSave || flight.current) return null;
    flight.current = true;
    setFailure(null);
    setSelectionError("");
    setReadError("");
    const abort = new AbortController();
    controller.current = abort;
    const check = () => { if (!active.current || abort.signal.aborted) throw new Error("Inactive file edit"); };
    try {
      setPhase("uploading");
      const add: string[] = [];
      for (const item of plan.additions) {
        check();
        const error = validateAssetFile(item.file!, kind, policy.maxBytes);
        if (error) { setSelectionError(error); setPhase("idle"); return null; }
        add.push(await uploadProfileFile(context, item.id, item.file!, kind, receipts.current,
          (state) => { check(); setProgress((previous) => ({ ...previous, [item.id]: state })); }, check));
      }
      check();
      const input = assetFilesChangeInputSchema.parse({ expectedUpdatedAt: baseline.asset.updatedAt, add, remove: plan.remove,
        ...(plan.reason ? { reason: plan.reason } : {}) });
      setPhase("saving");
      const result = await changeAssetFiles(context, baseline.asset.id, input, abort.signal);
      check();
      if (result.ok) { setPhase("success"); return result.data; }
      setFailure(result);
      setPhase(result.uncertain ? "uncertain" : "idle");
    } catch (error) {
      if (!active.current || abort.signal.aborted) return null;
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "UPLOAD_RETRY";
      setFailure(assetFilesFeedback(code === "NOT_FOUND" ? "UPLOAD_EXPIRED" : code));
      setPhase("idle");
    } finally { flight.current = false; }
    return null;
  }
  async function reload(discard: boolean): Promise<AssetFilesSnapshot | null> {
    if (busy || reading || flight.current) return null;
    if (discard && plan.dirty && !window.confirm("Reload the latest files and discard these pending changes?")) return null;
    setReading(true);
    setReadError("");
    const abort = new AbortController();
    controller.current = abort;
    try {
      const [asset, files] = await Promise.all([getAssetDetail(context, baseline.asset.id, abort.signal), getAssetFiles(context, baseline.asset.id, abort.signal)]);
      if (!active.current) return null;
      if (!asset.ok || !files.ok) { setReadError(!asset.ok ? asset.message : !files.ok ? files.message : "Could not reload files."); return null; }
      const snapshot = { asset: asset.data, files: files.data };
      setLatest(snapshot);
      if (discard) {
        for (const url of previews.current) URL.revokeObjectURL(url);
        previews.current.clear(); receipts.current.clear();
        setBaseline(snapshot);
        setItems(existingFileSelections(kind === "photo" ? files.data.photos : files.data.documents).filter((item) => item.id !== initialRemoveId));
        setReason(""); setFailure(null); setSelectionError(""); setProgress({}); setPhase("idle"); setLatest(null);
      }
      return snapshot;
    } catch { if (active.current) setReadError("Could not reload files. Your pending changes have been kept."); }
    finally { if (active.current) setReading(false); }
    return null;
  }
  function patchReason(value: string) { if (!locked && !flight.current) setReason(value); }
  return { baseline, original, items, reason, patchReason, plan, failure, selectionError, phase, progress, reading, readError, latest,
    busy, locked, canSave, select, remove, restore, save, reload, isBusy: () => flight.current || busy || reading };
}
