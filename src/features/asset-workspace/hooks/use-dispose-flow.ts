"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAssignOptions } from "../components/assignments/use-assign-flow";
import { useAssignEvidence } from "../components/assignments/use-assign-evidence";
import type { ActionSave } from "../components/assignments/SaveAlert";
import { disposeBlock, disposeBody, disposeErrors, lifecycleNeedsReload } from "../domain/asset-lifecycle-actions";
import { getAssetDetail, getAssetFiles } from "../services/asset-profile-api";
import { getRecentAssignments, postLifecycle } from "../services/asset-assignments-write";
import { useProfileRead } from "./use-asset-profile";

/** Frames 31–33: Details → Review → Confirm; the save happens on step 3 and returns to the profile (no result frame). */
export function useDisposeFlow(context: string, assetId: string, profile: string) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [method, setMethod] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [checked, setChecked] = useState(false);
  const [save, setSave] = useState<ActionSave>({ phase: "idle" });
  const [done, setDone] = useState(false);
  const sending = useRef(false);
  const detail = useProfileRead(`${context}:${assetId}:dispose-detail`, (signal) => getAssetDetail(context, assetId, signal));
  const files = useProfileRead(`${context}:${assetId}:dispose-files`, (signal) => getAssetFiles(context, assetId, signal));
  const recent = useProfileRead(`${context}:${assetId}:dispose-recent`, (signal) => getRecentAssignments(context, assetId, signal));
  const options = useProfileRead(`${context}:assign-options`, (signal) => getAssignOptions(context, signal));
  const evidence = useAssignEvidence(context, options.result?.ok ? options.result.data : null);
  const asset = detail.result?.ok ? detail.result.data : null;
  const photoFile = files.result?.ok ? files.result.data.photos[0] : undefined;
  const photo = photoFile?.thumbnailUrl ?? photoFile?.url ?? null;
  const draft = { method, reason, notes };
  const block = asset ? disposeBlock(asset) : null;
  const errors = disposeErrors(draft);
  const needsReload = lifecycleNeedsReload(save.code, save.uncertain);
  const canNext = Boolean(asset) && !block && Object.values(errors).every((error) => error === null)
    && !detail.pending && !options.pending && Boolean(options.result?.ok)
    && !evidence.busy && !evidence.failed && !needsReload && save.code !== "PERMISSION_DENIED";
  const canConfirm = canNext && step === 2 && checked && save.phase !== "sending" && !done;

  function next() {
    if (canNext && step < 2) setStep(step + 1);
  }

  async function confirm() {
    if (!canConfirm || !asset || sending.current) return;
    sending.current = true;
    setSave({ phase: "sending" });
    const body = disposeBody(asset.updatedAt, draft, evidence.fileIds);
    const result = await postLifecycle("dispose", context, asset.id, body, new AbortController().signal);
    if (result.ok) {
      setDone(true);
      toast.success(`Asset disposed. Transaction ID ${result.historyId}.`);
      router.push(`${profile}?tab=overview`);
      router.refresh();
      return;
    }
    sending.current = false;
    setSave({ phase: "failed", code: result.code, uncertain: result.uncertain });
    if (result.code === "VALIDATION" && !result.uncertain) setStep(0);
  }

  function reload() {
    if (sending.current) return;
    setSave({ phase: "idle" });
    setStep(0);
    detail.reload();
  }

  return {
    step, asset, photo, draft, errors, block, checked, evidence, save, done, detail, files, recent, options, needsReload,
    canNext, canConfirm, setMethod, setReason, setNotes, setChecked, next, confirm, reload,
    back: () => { if (!sending.current && step > 0) setStep(step - 1); },
    edit: () => { if (!sending.current) setStep(0); },
  };
}

export type DisposeFlow = ReturnType<typeof useDisposeFlow>;
