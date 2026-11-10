"use client";

import { useRef, useState } from "react";
import { assignBody, assignSteps, type AssignTarget } from "../../domain/assignment-assign";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { getAssetDetail, type ProfileReadResult } from "../../services/asset-profile-api";
import type { AssetDetail } from "../../services/asset-profile-contract";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { assignAsset, getRecentAssignments } from "../../services/asset-assignments-write";
import { useAssignEvidence } from "./use-assign-evidence";

async function getAssignOptions(context: string, signal: AbortSignal): Promise<ProfileReadResult<RegistrationOptions>> {
  const { refreshRegistrationOptions } = await import("../../services/asset-registration-client");
  try {
    return { ok: true, data: await refreshRegistrationOptions(context, signal) };
  } catch (error) {
    if (signal.aborted) throw error;
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "UNREACHABLE";
    return { ok: false, status: 0, code, message: "" };
  }
}

export type AssignSave = { phase: "idle" | "sending" | "failed"; code?: string; uncertain?: boolean };

/** FE 02 state. Input (target, reason, files) survives a Reload of the asset; changing the asset clears it. */
export function useAssignFlow(context: string, routeAssetId: string | null) {
  const steps = assignSteps(!routeAssetId);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<{ id: string; thumbnailUrl: string | null } | null>(null);
  const [target, setTarget] = useState<AssignTarget | null>(null);
  const [tab, setTab] = useState<AssignTarget["type"]>("person");
  const [reason, setReason] = useState("");
  const [save, setSave] = useState<AssignSave>({ phase: "idle" });
  const [saved, setSaved] = useState<{ before: AssetDetail; after: AssetDetail } | null>(null);
  const sending = useRef(false);
  const assetId = routeAssetId ?? picked?.id ?? null;
  const options = useProfileRead(`${context}:assign-options`, (signal) => getAssignOptions(context, signal));
  const detail = useProfileRead(`${context}:${assetId}:assign-detail`, (signal) => getAssetDetail(context, assetId ?? "", signal), Boolean(assetId));
  const recent = useProfileRead(`${context}:${assetId}:assign-recent`, (signal) => getRecentAssignments(context, assetId ?? "", signal), Boolean(assetId));
  const evidence = useAssignEvidence(context, options.result?.ok ? options.result.data : null);
  const asset = detail.result?.ok ? detail.result.data : null;
  const name = steps[step];

  function pick(id: string, thumbnailUrl: string | null) {
    if (picked?.id === id) return;
    setPicked({ id, thumbnailUrl });
    setTarget(null);
    setReason("");
    evidence.clear();
  }

  function chooseTab(next: AssignTarget["type"]) {
    setTab(next);
    if (target && target.type !== next) setTarget(null);
  }

  const canNext = name === "Select Asset" ? Boolean(picked)
    : name === "Assign Details" ? Boolean(asset && target && reason.length <= 500 && !evidence.busy && !evidence.failed) : false;

  async function confirm() {
    if (!asset || !target || sending.current) return;
    sending.current = true;
    setSave({ phase: "sending" });
    const body = assignBody({ updatedAt: asset.updatedAt, target, reason, fileIds: evidence.fileIds });
    const result = await assignAsset(context, asset.id, body, new AbortController().signal);
    sending.current = false;
    if (result.ok) {
      setSaved({ before: asset, after: result.data });
      setSave({ phase: "idle" });
      setStep(steps.length - 1);
    } else setSave({ phase: "failed", code: result.code, uncertain: result.uncertain });
  }

  function reload() {
    setSave({ phase: "idle" });
    detail.reload();
    recent.reload();
  }

  return {
    steps, step, name, setStep, next: () => canNext && setStep(step + 1), back: () => setStep(Math.max(0, step - 1)), canNext,
    picked, pick, assetId, asset, detail, recent, options, target, setTarget, tab, chooseTab, reason, setReason,
    evidence, save, saved, confirm, reload,
  };
}
export type AssignFlow = ReturnType<typeof useAssignFlow>;
