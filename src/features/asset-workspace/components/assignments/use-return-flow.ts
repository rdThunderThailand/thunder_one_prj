"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { assetReturnBlock, returnBody, returnCondition, returnNeedsReload, RETURN_STEPS } from "../../domain/assignment-return";
import { ASSIGN_REASON_MAX } from "../../domain/assignment-assign";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { getAssetDetail, getAssetFiles } from "../../services/asset-profile-api";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { getRecentAssignments, returnAsset } from "../../services/asset-assignments-write";
import type { ActionSave } from "./SaveAlert";
import { getAssignOptions } from "./use-assign-flow";
import { useAssignEvidence } from "./use-assign-evidence";

export function useReturnFlow(context: string, assetId: string) {
  const router = useRouter();
  const search = useSearchParams();
  const [step, setStep] = useState(0);
  const [chosenCondition, setCondition] = useState(() => returnCondition(search.get("condition")));
  const [reason, setReason] = useState("");
  const [save, setSave] = useState<ActionSave>({ phase: "idle" });
  const [saved, setSaved] = useState<{ before: AssetDetail; after: AssetDetail } | null>(null);
  const sending = useRef(false);
  const options = useProfileRead(`${context}:assign-options`, (signal) => getAssignOptions(context, signal));
  const detail = useProfileRead(`${context}:${assetId}:return-detail`, (signal) => getAssetDetail(context, assetId, signal));
  const recent = useProfileRead(`${context}:${assetId}:return-recent`, (signal) => getRecentAssignments(context, assetId, signal));
  const files = useProfileRead(`${context}:${assetId}:return-files`, (signal) => getAssetFiles(context, assetId, signal));
  const evidence = useAssignEvidence(context, options.result?.ok ? options.result.data : null);
  const asset = detail.result?.ok ? detail.result.data : null;
  const photo = files.result?.ok ? files.result.data.photos[0]?.thumbnailUrl ?? files.result.data.photos[0]?.url ?? null : null;
  const condition = chosenCondition ?? returnCondition(asset?.condition);
  const valid = Boolean(asset && !assetReturnBlock(asset) && condition && options.result?.ok)
    && reason.length <= ASSIGN_REASON_MAX && !evidence.busy && !evidence.failed;
  const canNext = valid && !detail.pending && !options.pending && !returnNeedsReload(save);
  const canConfirm = canNext && step === 1 && save.phase !== "sending" && !saved;

  function next() {
    if (!canNext || step !== 0) return;
    setCondition(condition);
    setStep(1);
  }

  async function confirm() {
    if (!canConfirm || !asset || !condition || sending.current) return;
    sending.current = true;
    setSave({ phase: "sending" });
    const body = returnBody({ updatedAt: asset.updatedAt, condition, reason, fileIds: evidence.fileIds });
    const result = await returnAsset(context, asset.id, body, new AbortController().signal);
    if (result.ok) {
      // Keep a successful write locked even if an old event handler is retained.
      setSaved({ before: asset, after: result.data });
      setSave({ phase: "idle" });
      setStep(2);
      router.refresh();
    } else {
      sending.current = false;
      setSave({ phase: "failed", code: result.code, uncertain: result.uncertain });
    }
  }

  function reload() {
    if (sending.current) return;
    setCondition(condition);
    setSave({ phase: "idle" });
    detail.reload();
    recent.reload();
  }

  return {
    steps: RETURN_STEPS, step, name: RETURN_STEPS[step], next, back: () => !sending.current && setStep(Math.max(0, step - 1)),
    canNext, canConfirm, asset, photo, detail, recent, options, condition, setCondition, reason, setReason,
    evidence, save, saved, confirm, reload,
  };
}
export type ReturnFlow = ReturnType<typeof useReturnFlow>;
