import { useEffect, useRef, useState } from "react";
import { assetEditDraft, assetEditPatch, assetEditWithReason, type AssetEditDraft, type AssetEditErrors } from "../domain/asset-edit";
import { updateAssetDetails, type AssetEditFailure } from "../services/asset-edit-api";
import { getAssetDetail } from "../services/asset-profile-api";
import type { AssetDetail } from "../services/asset-profile-contract";

export function useAssetEdit(context: string, initial: AssetDetail) {
  const [asset, setAsset] = useState(initial);
  const [draft, setDraft] = useState(() => assetEditDraft(initial));
  const [fields, setFields] = useState<AssetEditErrors>({});
  const [failure, setFailure] = useState<AssetEditFailure | null>(null);
  const [phase, setPhase] = useState<"idle" | "sending" | "uncertain" | "success">("idle");
  const [reason, setReason] = useState("");
  const [rejectedSerial, setRejectedSerial] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [reloadError, setReloadError] = useState("");
  const mounted = useRef(false);
  const flight = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);
  const validation = assetEditPatch(asset, draft);
  const requiresReason = rejectedSerial !== null && draft.serialNumber.trim() === rejectedSerial;
  const locked = phase !== "idle" || reloading || asset.lifecycleStatus === "Disposed" || failure?.code === "INVALID_STATE";
  const blocked = failure?.code === "STALE" || failure?.code === "PERMISSION_DENIED" || failure?.code === "UNAUTHENTICATED" || failure?.code === "NOT_FOUND";

  function patch(changes: Partial<AssetEditDraft>) {
    if (locked || flight.current) return;
    setDraft((previous) => ({ ...previous, ...changes }));
    setFields((previous) => {
      const next = { ...previous };
      for (const key of Object.keys(changes) as (keyof AssetEditDraft)[]) delete next[key];
      return next;
    });
    if (changes.serialNumber !== undefined && changes.serialNumber.trim() !== rejectedSerial) {
      setRejectedSerial(null);
      setReason("");
      if (failure?.code === "SERIAL_DUPLICATE") setFailure(null);
    }
  }
  async function submit() {
    if (locked || blocked || flight.current) return null;
    if (!validation.valid) { setFields(validation.fields); return null; }
    if (!validation.dirty) return null;
    const confirmed = assetEditWithReason(validation.input, draft.serialNumber, rejectedSerial, reason);
    if (!confirmed.input) { setFields(confirmed.fields); return null; }
    flight.current = true;
    setPhase("sending");
    setFailure(null);
    setFields({});
    const abort = new AbortController();
    controller.current = abort;
    const result = await updateAssetDetails(context, asset.id, confirmed.input, abort.signal);
    if (!mounted.current) return null;
    if (result.ok) { setPhase("success"); return result.data; }
    flight.current = result.uncertain;
    setPhase(result.uncertain ? "uncertain" : "idle");
    setFailure(result);
    setFields(result.fields);
    if (result.code === "SERIAL_DUPLICATE") setRejectedSerial(draft.serialNumber.trim());
    return null;
  }
  async function reload() {
    if (flight.current || reloading || phase === "sending") return;
    if (validation.dirty && !window.confirm("Reload and replace your unsaved changes with the latest asset details?")) return;
    setReloading(true);
    setReloadError("");
    const abort = new AbortController();
    controller.current = abort;
    try {
      const result = await getAssetDetail(context, asset.id, abort.signal);
      if (!mounted.current) return;
      if (!result.ok) { setReloadError(result.message); return; }
      setAsset(result.data);
      setDraft(assetEditDraft(result.data));
      setFields({});
      setFailure(null);
      setRejectedSerial(null);
      setReason("");
      setPhase("idle");
    } catch { if (mounted.current) setReloadError("Could not reload the asset. Your input has been kept."); }
    finally { if (mounted.current) setReloading(false); }
  }
  function patchReason(value: string) {
    if (locked) return;
    setReason(value);
    setFields((previous) => { const next = { ...previous }; delete next.serialOverrideReason; return next; });
  }
  return { asset, draft, fields, failure, phase, patch, submit, reload, reloading, reloadError, locked,
    reason, setReason: patchReason, requiresReason, dirty: validation.dirty,
    canSave: !locked && !blocked && validation.dirty };
}
