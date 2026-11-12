"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getAssignOptions } from "../components/assignments/use-assign-flow";
import { useAssignEvidence } from "../components/assignments/use-assign-evidence";
import type { ActionSave } from "../components/assignments/SaveAlert";
import { lifecycleNeedsReload, retireBody, retireEligibility, retireErrors, type RetireDraft } from "../domain/asset-lifecycle-actions";
import { getAssetDetail, getAssetFiles } from "../services/asset-profile-api";
import { postLifecycle } from "../services/asset-assignments-write";
import type { AssetDetail } from "../services/asset-profile-contract";
import { useProfileRead } from "./use-asset-profile";

export function useRetireFlow(context: string, assetId: string) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [condition, setCondition] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [save, setSave] = useState<ActionSave>({ phase: "idle" });
  const [saved, setSaved] = useState<{
    before: AssetDetail; after: AssetDetail; historyId: string; confirmedAt: string; draft: RetireDraft;
  } | null>(null);
  const sending = useRef(false);
  const detail = useProfileRead(`${context}:${assetId}:retire-detail`, (signal) => getAssetDetail(context, assetId, signal));
  const files = useProfileRead(`${context}:${assetId}:retire-files`, (signal) => getAssetFiles(context, assetId, signal));
  const options = useProfileRead(`${context}:assign-options`, (signal) => getAssignOptions(context, signal));
  const evidence = useAssignEvidence(context, options.result?.ok ? options.result.data : null);
  const asset = detail.result?.ok ? detail.result.data : null;
  const photoFile = files.result?.ok ? files.result.data.photos[0] : undefined;
  const photo = photoFile?.thumbnailUrl ?? photoFile?.url ?? null;
  const draft = { condition: condition ?? asset?.condition ?? "", reason, notes };
  const eligibility = asset ? retireEligibility(asset) : null;
  const errors = retireErrors(draft);
  const needsReload = lifecycleNeedsReload(save.code, save.uncertain);
  const canNext = eligibility?.kind === "ok" && Object.values(errors).every((error) => error === null)
    && !detail.pending && !options.pending && Boolean(options.result?.ok)
    && !evidence.busy && !evidence.failed && !needsReload && save.code !== "PERMISSION_DENIED";
  const canConfirm = canNext && step === 1 && save.phase !== "sending" && !saved;

  function next() {
    if (!canNext || step !== 0) return;
    setCondition(draft.condition);
    setStep(1);
  }

  async function confirm() {
    if (!canConfirm || !asset || sending.current) return;
    sending.current = true;
    setSave({ phase: "sending" });
    const body = retireBody(asset.updatedAt, draft, evidence.fileIds);
    const result = await postLifecycle("retire", context, asset.id, body, new AbortController().signal);
    if (result.ok) {
      setSaved({ before: asset, after: result.data, historyId: result.historyId, confirmedAt: new Date().toISOString(), draft });
      setSave({ phase: "idle" });
      setStep(2);
      router.refresh();
      return;
    }
    sending.current = false;
    setSave({ phase: "failed", code: result.code, uncertain: result.uncertain });
    if (result.code === "VALIDATION" && !result.uncertain) setStep(0);
  }

  function reload() {
    if (sending.current) return;
    setCondition(draft.condition);
    setSave({ phase: "idle" });
    setStep(0);
    detail.reload();
  }

  return {
    step, asset, photo, draft, errors, eligibility, evidence, save, saved, detail, files, options, needsReload, canNext,
    canConfirm, setCondition, setReason, setNotes, next, confirm, reload,
    back: () => { if (!sending.current && step === 1) setStep(0); },
  };
}

export type RetireFlow = ReturnType<typeof useRetireFlow>;
