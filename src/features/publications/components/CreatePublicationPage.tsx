"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeftIcon, ArrowRightIcon, PaperPlaneIcon } from "@/components/ui/icons";
import { wizardSteps } from "../mock-data";
import { useHasHydratedDraft, useIsDraftDirty, usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { usePublishDraft } from "../hooks/usePublishDraft";
import { deletePublication, fetchPlaylist, fetchPublication } from "../services/publications-api";
import { detailToDraft } from "../detail-mapping";
import type { PlaylistDetail } from "../types";
import { attemptNext, isResumePending } from "../next-transition";
import { type WizardStepId } from "../step-validation";
import { BasicInfoForm } from "./BasicInfoForm";
import { ChannelsStep } from "./ChannelsStep";
import { ContentStep } from "./ContentStep";
import { PreviewPanel } from "./PreviewPanel";
import { PublicationStepper } from "./PublicationStepper";
import { ReviewPublishStep } from "./ReviewPublishStep";
import { ScheduleStep } from "./ScheduleStep";

const MAX_BUILT_STEP = 5;

export function CreatePublicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const hasHydrated = useHasHydratedDraft();
  const isDirty = useIsDraftDirty();
  const step = usePublicationDraftStore((s) => s.step);
  const publicationId = usePublicationDraftStore((s) => s.publicationId);
  const goNextAction = usePublicationDraftStore((s) => s.goNext);
  const goBack = usePublicationDraftStore((s) => s.goBack);

  const setPublicationId = usePublicationDraftStore((s) => s.setPublicationId);
  const setStep = usePublicationDraftStore((s) => s.setStep);
  const setBasicInfo = usePublicationDraftStore((s) => s.setBasicInfo);
  const setAssetItems = usePublicationDraftStore((s) => s.setAssetItems);
  const setChannelIds = usePublicationDraftStore((s) => s.setChannelIds);
  const setScheduleForm = usePublicationDraftStore((s) => s.setScheduleForm);

  const [resumedId, setResumedId] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const loadedIdRef = useRef<string | null>(null);

  // Derived, not state: `resumedId` only settles once the fetch has finished, so
  // the wizard never paints the *previous* draft's values before ?id= replaces
  // them. Starting from a boolean that flips inside the effect would show one
  // frame of the wrong publication.
  const resumePending = isResumePending(idParam, resumedId, publicationId);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!idParam) return;
    if (idParam === publicationId) return;
    if (loadedIdRef.current === idParam) return;

    loadedIdRef.current = idParam;
    let alive = true;

    const load = async () => {
      try {
        const detail = await fetchPublication(idParam);
        let playlist: PlaylistDetail | null = null;
        if (detail.playlist?.id) {
          try {
            playlist = await fetchPlaylist(detail.playlist.id);
          } catch {
            // Ignore playlist error per spec
          }
        }

        if (!alive) return;

        const draft = detailToDraft(detail, playlist);

        setBasicInfo(draft.basicInfo);
        setAssetItems(draft.assetItems);
        setChannelIds(draft.channelIds);
        setScheduleForm(draft.scheduleForm);
        setPublicationId(detail.id);
        setStep(1);
        usePublicationDraftStore.getState().markSaved();
        usePublicationDraftStore.getState().setExplicitlySaved(true);
      } catch (err) {
        if (!alive) return;
        setResumeError(err instanceof Error ? err.message : "โหลด draft ไม่สำเร็จ");
      } finally {
        // Marks the attempt finished either way, so a failure shows the error
        // instead of hanging on the loading branch forever.
        if (alive) setResumedId(idParam);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [
    hasHydrated,
    idParam,
    publicationId,
    setBasicInfo,
    setAssetItems,
    setChannelIds,
    setScheduleForm,
    setPublicationId,
    setStep,
  ]);

  const {
    screens,
    screensError,
    campaigns,
    assets,
    loadingRefs,
    saving,
    error,
    setError,
    publishedId,
    conflicts,
    checkingConflicts,
    conflictsError,
    saveDraft,
    publishNow,
    canPublish,
    eligibilityChecks,
    persistDraft,
    saveStatus,
    setSaveStatus,
    savingNext,
    setSavingNext,
  } = usePublishDraft();

  const performCancel = async () => {
    setCancelBusy(true);
    const state = usePublicationDraftStore.getState();
    if (state.publicationId && !state.explicitlySaved) {
      try {
        await deletePublication(state.publicationId);
      } catch {
        // Best-effort cleanup of an orphaned empty draft — don't block navigation on it.
      }
    }
    state.cancelDraft();
    router.push("/publications");
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setConfirmingCancel(true);
    } else {
      performCancel();
    }
  };

  const handleNext = async () => {
    if (savingNext) return;
    const outcome = await attemptNext(
      step as WizardStepId,
      usePublicationDraftStore.getState(),
      () => {
        // Only reached when the step validates, so the "saving" flip and the
        // stale-error clear both land at the same moment they used to.
        setValidationErrors([]);
        setSavingNext(true);
        setSaveStatus("saving");
        return persistDraft(false);
      }
    );

    if (outcome.kind === "invalid") {
      setValidationErrors(outcome.errors);
      return;
    }
    setSavingNext(false);
    if (outcome.kind === "saved") {
      setSaveStatus("saved");
      setError(null); // clear a stale error from a prior failed attempt (e.g. Retry succeeding)
      goNextAction(MAX_BUILT_STEP);
    } else {
      setSaveStatus("error");
      setError(outcome.message);
    }
  };

  const isLastStep = step === wizardSteps.length;
  const nextStepLabel = wizardSteps[step]?.label ?? wizardSteps[wizardSteps.length - 1].label;
  const prevStepLabel = wizardSteps[step - 2]?.label;
  const nextButtonContent =
    saveStatus === "saving" ? (
      "Saving…"
    ) : (
      <>
        Next: {nextStepLabel} <ArrowRightIcon className="h-4 w-4" />
      </>
    );

  // Avoid flashing step-1 defaults before a restored draft (possibly on a
  // later step) loads from localStorage or via ?id=.
  if (!hasHydrated || resumePending) return null;

  const displayError = error || resumeError;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Create Publication"
        subtitle="สร้างและเผยแพร่สื่อไปยังทุกช่องทางของคุณ"
        actions={
          isLastStep ? (
            <>
              <Button variant="secondary" onClick={handleCancelClick} disabled={cancelBusy}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={goBack}>
                <ArrowLeftIcon className="h-4 w-4" /> Back{prevStepLabel ? `: ${prevStepLabel}` : ""}
              </Button>
              <Button variant="primary" onClick={publishNow} disabled={saving || !canPublish}>
                <PaperPlaneIcon className="h-4 w-4" /> {saving ? "Publishing…" : "Publish Now"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={handleCancelClick} disabled={cancelBusy}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={saveDraft} disabled={saving}>
                {saving ? "Saving…" : "Save as Draft"}
              </Button>
              <Button variant="primary" onClick={handleNext} disabled={savingNext || step >= MAX_BUILT_STEP}>
                {nextButtonContent}
              </Button>
            </>
          )
        }
      />

      {confirmingCancel && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ออกจากหน้านี้จะทำให้ข้อมูลหายไป ดำเนินการต่อ?</span>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setConfirmingCancel(false)}>
              Stay
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 px-3 py-1.5 text-xs hover:bg-red-500"
              onClick={performCancel}
              disabled={cancelBusy}
            >
              {cancelBusy ? "Leaving…" : "Leave"}
            </Button>
          </div>
        </div>
      )}

      <Card className="p-5">
        <PublicationStepper currentStep={step} />
      </Card>

      {step === 1 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <BasicInfoForm campaigns={campaigns} />
          </div>
          <div>
            <PreviewPanel campaigns={campaigns} />
          </div>
        </div>
      )}

      {step === 2 && <ContentStep campaigns={campaigns} />}
      {step === 3 && (
        <ChannelsStep screens={screens} loadingScreens={loadingRefs} screensError={screensError} />
      )}
      {step === 4 && (
        <ScheduleStep
          campaigns={campaigns}
          screens={screens}
          assets={assets}
          conflicts={conflicts}
          checkingConflicts={checkingConflicts}
          conflictsError={conflictsError}
        />
      )}
      {step === 5 && (
        <ReviewPublishStep
          campaigns={campaigns}
          screens={screens}
          assets={assets}
          conflicts={conflicts}
          eligibilityChecks={eligibilityChecks}
        />
      )}

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-4">
          {step > 1 ? (
            <Button variant="secondary" onClick={goBack}>
              <ArrowLeftIcon className="h-4 w-4" /> Back{prevStepLabel ? `: ${prevStepLabel}` : ""}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-1 items-center gap-3">
            <span className="whitespace-nowrap text-xs text-zinc-500">
              {step} of {wizardSteps.length} steps completed
            </span>
            <div className="h-1.5 flex-1 rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${(step / wizardSteps.length) * 100}%` }}
              />
            </div>
          </div>
          {isLastStep ? (
            <Button variant="primary" onClick={publishNow} disabled={saving || !canPublish}>
              <PaperPlaneIcon className="h-4 w-4" /> {saving ? "Publishing…" : "Publish Now"}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleNext} disabled={savingNext || step >= MAX_BUILT_STEP}>
              {nextButtonContent}
            </Button>
          )}
        </div>
        {validationErrors.length > 0 && (
          <div className="flex flex-col gap-1">
            {validationErrors.map((err, idx) => (
              <p key={idx} className="text-xs font-medium text-red-600">
                {err}
              </p>
            ))}
          </div>
        )}
        {displayError && (
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-red-600">{displayError}</p>
            {saveStatus === "error" && (
              <Button
                variant="secondary"
                className="px-2.5 py-1 text-xs"
                onClick={handleNext}
                disabled={savingNext}
              >
                Retry
              </Button>
            )}
          </div>
        )}
        {publishedId && (
          <p className="text-xs font-medium text-emerald-600">
            Published successfully! (ID: {publishedId})
          </p>
        )}
      </Card>
    </div>
  );
}
