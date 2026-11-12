"use client";

import { useRef, useState } from "react";
import type { AssignTarget } from "../../domain/assignment-assign";
import { conditionBlocksTransfer, isCurrentHolder, TRANSFER_STEPS, transferBody } from "../../domain/assignment-transfer";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { getAssetDetail, getAssetFiles } from "../../services/asset-profile-api";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { getRecentAssignments, transferAsset } from "../../services/asset-assignments-write";
import type { ActionSave } from "./SaveAlert";
import { getAssignOptions } from "./use-assign-flow";
import { useAssignEvidence } from "./use-assign-evidence";

export type TransferLocation = { id: string; name: string };

/** FE 03 state. Input survives a Reload of the asset. Condition starts as the asset's own condition. */
export function useTransferFlow(context: string, assetId: string) {
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState<AssignTarget | null>(null);
  const [tab, setTab] = useState<AssignTarget["type"]>("person");
  const [chosenCondition, setCondition] = useState<string | null>(null);
  const [location, setLocation] = useState<TransferLocation | null>(null);
  const [reason, setReason] = useState("");
  const [save, setSave] = useState<ActionSave>({ phase: "idle" });
  const [saved, setSaved] = useState<{ before: AssetDetail; after: AssetDetail } | null>(null);
  const sending = useRef(false);
  const options = useProfileRead(`${context}:assign-options`, (signal) => getAssignOptions(context, signal));
  const detail = useProfileRead(`${context}:${assetId}:transfer-detail`, (signal) => getAssetDetail(context, assetId, signal));
  const recent = useProfileRead(`${context}:${assetId}:transfer-recent`, (signal) => getRecentAssignments(context, assetId, signal));
  const files = useProfileRead(`${context}:${assetId}:transfer-files`, (signal) => getAssetFiles(context, assetId, signal));
  const evidence = useAssignEvidence(context, options.result?.ok ? options.result.data : null);
  const asset = detail.result?.ok ? detail.result.data : null;
  // Same source as the profile hero: the first photo of `GET {id}/files`.
  const photo = files.result?.ok ? files.result.data.photos[0]?.thumbnailUrl ?? files.result.data.photos[0]?.url ?? null : null;
  const condition = chosenCondition ?? asset?.condition ?? null;
  const sameHolder = isCurrentHolder(asset?.custody ?? null, target);
  const name = TRANSFER_STEPS[step];
  const canNext = name === "Transfer Details" && Boolean(asset && target && condition) && !sameHolder
    && !conditionBlocksTransfer(condition) && reason.length <= 500 && !evidence.busy && !evidence.failed;

  function chooseTab(next: AssignTarget["type"]) {
    setTab(next);
    if (target && target.type !== next) setTarget(null);
  }

  async function confirm() {
    if (!asset || !target || !condition || sending.current) return;
    sending.current = true;
    setSave({ phase: "sending" });
    const body = transferBody({
      updatedAt: asset.updatedAt, target, condition, locationId: location?.id ?? null, currentLocationId: asset.location?.id ?? null,
      reason, fileIds: evidence.fileIds,
    });
    const result = await transferAsset(context, asset.id, body, new AbortController().signal);
    sending.current = false;
    if (result.ok) {
      setSaved({ before: asset, after: result.data });
      setSave({ phase: "idle" });
      setStep(TRANSFER_STEPS.length - 1);
    } else setSave({ phase: "failed", code: result.code, uncertain: result.uncertain });
  }

  function reload() {
    setSave({ phase: "idle" });
    detail.reload();
    recent.reload();
  }

  return {
    steps: TRANSFER_STEPS, step, name, next: () => canNext && setStep(step + 1), back: () => setStep(Math.max(0, step - 1)), canNext,
    asset, photo, detail, recent, options, target, setTarget, tab, chooseTab, sameHolder, condition, setCondition, location, setLocation,
    reason, setReason, evidence, save, saved, confirm, reload,
  };
}
export type TransferFlow = ReturnType<typeof useTransferFlow>;
