"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { REVIEW_CLICK_GUARD_MS } from "../../domain/asset-lifecycle-actions";
import {
  addWarrantyBody, draftFromRecord, emptyWarrantyDraft, updateWarrantyBody, warrantyErrors, warrantyNeedsReload,
  type WarrantyDraft,
} from "../../domain/warranty-form";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { getRecentAssignments } from "../../services/asset-assignments-write";
import { getAssetDetail, getAssetFiles } from "../../services/asset-profile-api";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { addWarranty, asProfileRead, getWarrantyRecords, updateWarranty, type WarrantyRecord } from "../../services/warranty-write";
import { getAssignOptions } from "../assignments/use-assign-flow";
import type { ActionSave } from "../assignments/SaveAlert";
import { useWarrantyDocuments } from "./use-warranty-documents";

export type WarrantyStep = "select" | "details" | "review" | "result";
const NONE = "00000000-0000-4000-8000-000000000000";

/** FE 04 Add / Edit Warranty. `assetId` null = list route, which starts with Select Asset. */
export function useWarrantyFlow(context: string, assetId: string | null, warrantyId: string | null) {
  const router = useRouter();
  const [picked, setPicked] = useState<{ id: string; thumbnailUrl: string | null } | null>(null);
  const id = assetId ?? picked?.id ?? null;
  const [step, setStep] = useState<WarrantyStep>(assetId ? "details" : "select");
  const [draft, setDraft] = useState<WarrantyDraft | null>(null);
  const [save, setSave] = useState<ActionSave>({ phase: "idle" });
  const [saved, setSaved] = useState<{ warranty: WarrantyRecord; draft: WarrantyDraft; documents: string[] } | null>(null);
  const sending = useRef(false);
  const reviewOpenedAt = useRef(0);
  const target = id ?? NONE;
  const detail = useProfileRead(`${context}:${target}:warranty-detail`, (signal) => getAssetDetail(context, target, signal), Boolean(id));
  const records = useProfileRead(`${context}:${target}:warranty-records`,
    async (signal) => asProfileRead(await getWarrantyRecords(context, target, signal)), Boolean(id));
  const files = useProfileRead(`${context}:${target}:warranty-files`, (signal) => getAssetFiles(context, target, signal), Boolean(id));
  const recent = useProfileRead(`${context}:${target}:warranty-recent`, (signal) => getRecentAssignments(context, target, signal), Boolean(id));
  const options = useProfileRead(`${context}:assign-options`, (signal) => getAssignOptions(context, signal));
  const asset: AssetDetail | null = detail.result?.ok ? detail.result.data : null;
  const list = records.result?.ok ? records.result.data : null;
  const record = warrantyId && list ? list.find((item) => item.id === warrantyId) ?? null : null;
  const currentId = list?.find((item) => item.isCurrent)?.id ?? null;
  const linked = warrantyId && files.result?.ok
    ? files.result.data.warrantyDocuments.filter((file) => file.warrantyId === warrantyId).length : 0;
  const documents = useWarrantyDocuments(context, options.result?.ok ? options.result.data : null, linked);
  const base = record ? draftFromRecord(record) : emptyWarrantyDraft(Boolean(currentId));
  const value = draft ?? base;
  const errors = warrantyErrors(value);
  const disposed = asset?.lifecycleStatus === "Disposed" || save.code === "INVALID_STATE";
  const needsReload = warrantyNeedsReload(save.code, save.uncertain);
  const ready = Boolean(asset && list && options.result?.ok && (!warrantyId || record));
  const canNext = ready && !disposed && Object.values(errors).every((error) => error === null)
    && !documents.busy && !documents.failed && !needsReload && save.code !== "PERMISSION_DENIED";
  const canConfirm = canNext && step === "review" && save.phase !== "sending" && !saved;
  const photoFile = files.result?.ok ? files.result.data.photos[0] : undefined;
  const photo = photoFile?.thumbnailUrl ?? photoFile?.url ?? picked?.thumbnailUrl ?? null;

  function set<K extends keyof WarrantyDraft>(key: K, next: WarrantyDraft[K]) {
    setDraft((previous) => ({ ...(previous ?? base), [key]: next }));
  }

  function next() {
    if (step === "select") { if (picked) setStep("details"); return; }
    if (!canNext || step !== "details") return;
    setDraft(value);
    reviewOpenedAt.current = Date.now();
    setStep("review");
  }

  async function confirm() {
    if (!canConfirm || !asset || sending.current || Date.now() - reviewOpenedAt.current < REVIEW_CLICK_GUARD_MS) return;
    sending.current = true;
    setSave({ phase: "sending" });
    const signal = new AbortController().signal;
    const result = record
      ? await updateWarranty(context, asset.id, record.id, updateWarrantyBody(value, documents.fileIds, record.updatedAt), signal)
      : await addWarranty(context, asset.id, addWarrantyBody(value, documents.fileIds, currentId), signal);
    if (result.ok) {
      setSaved({ warranty: result.data.warranty, draft: value, documents: documents.items.map((item) => item.file.name) });
      setSave({ phase: "idle" });
      setStep("result");
      records.reload();
      router.refresh();
      return;
    }
    sending.current = false;
    setSave({ phase: "failed", code: result.code, uncertain: result.uncertain });
    if (result.code === "VALIDATION" && !result.uncertain) setStep("details");
  }

  /** STALE / NOT_FOUND / uncertain: read the asset and its warranties again. */
  function reload() {
    if (sending.current) return;
    // Edit re-bases on the fresh record so a second Confirm can't overwrite the other change with old values.
    if (warrantyId) setDraft(null);
    setSave({ phase: "idle" });
    setStep("details");
    detail.reload();
    records.reload();
  }

  return {
    step, asset, record, currentId, list, photo, picked, draft: value, errors, documents, linked, disposed, save, saved,
    detail, records, files, recent, options, needsReload, ready, canNext, canConfirm, set, next, confirm, reload,
    edit: Boolean(warrantyId),
    pick: (assetPick: string, thumbnailUrl: string | null) => { setPicked({ id: assetPick, thumbnailUrl }); setDraft(null); },
    back: () => {
      if (sending.current) return;
      if (step === "review") setStep("details");
      else if (step === "details" && !assetId) setStep("select");
    },
  };
}

export type WarrantyFlow = ReturnType<typeof useWarrantyFlow>;
