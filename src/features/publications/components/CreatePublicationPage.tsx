"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NoAccess } from "@/components/ui/NoAccess";
import { ArrowLeftIcon, ArrowRightIcon, PaperPlaneIcon } from "@/components/ui/icons";
import { wizardSteps } from "../mock-data";
import { useHasHydratedDraft, useIsDraftDirty, usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { hasDraftContent, shouldShowResumePrompt } from "../resume-prompt";
import { Modal } from "@/components/ui/Modal";
import { usePublishDraft } from "../hooks/usePublishDraft";
import { deletePublication, fetchPublication } from "../services/publications-api";
import { fetchPlaylist } from "@/features/playlists";
import { detailToDraft } from "../detail-mapping";
import { isConflict, classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
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
  const [resumeFailure, setResumeFailure] = useState<ClassifiedError | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [dismissedResume, setDismissedResume] = useState(false);
  const loadedIdRef = useRef<string | null>(null);

  // Captured once, the first time we render with a rehydrated store. Anything the operator
  // types afterwards must not change this answer.
  const hadContentAtHydrationRef = useRef<boolean | null>(null);
  // eslint-disable-next-line react-hooks/refs
  if (hasHydrated && hadContentAtHydrationRef.current === null) {
    hadContentAtHydrationRef.current = hasDraftContent(usePublicationDraftStore.getState());
  }
  // eslint-disable-next-line react-hooks/refs
  const hadContentAtHydration = hadContentAtHydrationRef.current ?? false;

  // Derived, not state: `resumedId` only settles once the fetch has finished, so
  // the wizard never paints the *previous* draft's values before ?id= replaces
  // them. Starting from a boolean that flips inside the effect would show one
  // frame of the wrong publication.
  const resumePending = isResumePending(idParam, resumedId, publicationId);

  // Shared by the `?id=` resume effect below and the revision-conflict banner's
  // "โหลดใหม่" action — both fully overwrite local state from the server, on
  // the premise that any local edits are the ones in question, not worth keeping.
  const loadPublicationIntoDraft = useCallback(
    async (id: string) => {
      const detail = await fetchPublication(id);
      let playlist: PlaylistDetail | null = null;
      if (detail.playlist?.id) {
        try {
          playlist = await fetchPlaylist(detail.playlist.id);
        } catch {
          // Ignore playlist error per spec
        }
      }

      const draft = detailToDraft(detail, playlist);

      setBasicInfo(draft.basicInfo);
      setAssetItems(draft.assetItems);
      setChannelIds(draft.channelIds);
      setScheduleForm(draft.scheduleForm);
      setPublicationId(detail.id);
      usePublicationDraftStore.getState().setRevision(detail.revision ?? null);
      usePublicationDraftStore.getState().markSaved();
      usePublicationDraftStore.getState().setExplicitlySaved(true);
    },
    [setBasicInfo, setAssetItems, setChannelIds, setScheduleForm, setPublicationId]
  );

  useEffect(() => {
    if (!hasHydrated) return;
    if (!idParam) return;
    if (idParam === publicationId) return;
    if (loadedIdRef.current === idParam) return;

    loadedIdRef.current = idParam;
    let alive = true;

    const load = async () => {
      setResumeFailure(null);
      try {
        await loadPublicationIntoDraft(idParam);
        if (!alive) return;
        setStep(1);
      } catch (err) {
        if (!alive) return;
        setResumeFailure(classifyApiError(err, "โหลด draft ไม่สำเร็จ"));
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
  }, [hasHydrated, idParam, publicationId, loadPublicationIntoDraft, setStep]);

  const [retrying, setRetrying] = useState(false);

  const handleRetryResume = async () => {
    if (!idParam || retrying) return;
    setRetrying(true);
    setResumeFailure(null);
    try {
      await loadPublicationIntoDraft(idParam);
      setStep(1);
    } catch (err) {
      setResumeFailure(classifyApiError(err, "โหลด draft ไม่สำเร็จ"));
    } finally {
      setRetrying(false);
    }
  };

  const {
    channels,
    channelsError,
    campaigns,
    tags,
    assets,
    loadingRefs,
    saving,
    error,
    setError,
    publishedId,
    conflicts,
    checkingConflicts,
    conflictsError,
    revisionConflict,
    setRevisionConflict,
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

  const [conflictBusy, setConflictBusy] = useState(false);

  const handleReloadFromServer = async () => {
    if (!publicationId) return;
    setConflictBusy(true);
    try {
      await loadPublicationIntoDraft(publicationId);
      setRevisionConflict(null);
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "โหลด draft ไม่สำเร็จ");
    } finally {
      setConflictBusy(false);
    }
  };

  // Deliberately does not retry the save that hit the conflict — that action
  // (Save / Next / Publish) is a click the user makes again themselves, so an
  // overwrite is never silently auto-retried. Only re-arms the revision this
  // draft is holding, from the row's current value.
  const handleOverwrite = async () => {
    if (!publicationId) return;
    setConflictBusy(true);
    try {
      const detail = await fetchPublication(publicationId);
      usePublicationDraftStore.getState().setRevision(detail.revision ?? null);
      setRevisionConflict(null);
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "โหลดข้อมูลล่าสุดไม่สำเร็จ");
    } finally {
      setConflictBusy(false);
    }
  };

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
        setShowFieldErrors(false);
        setSavingNext(true);
        setSaveStatus("saving");
        return persistDraft(false);
      },
      // Empty means the campaign list has not loaded — skip the availability check
      // rather than flag a valid campaignId as gone.
      campaigns.length > 0 ? { campaignIds: campaigns.map((c) => c.id) } : undefined
    );

    if (outcome.kind === "invalid") {
      setValidationErrors(outcome.errors);
      if (step === 1 || step === 4) setShowFieldErrors(true);
      return;
    }
    setSavingNext(false);
    if (outcome.kind === "saved") {
      setSaveStatus("saved");
      setError(null); // clear a stale error from a prior failed attempt (e.g. Retry succeeding)
      goNextAction(MAX_BUILT_STEP);
    } else {
      setSaveStatus("error");
      // The revision-conflict banner already shows this — avoid saying it twice.
      if (!isConflict(outcome.message)) setError(outcome.message);
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
  // later step) loads from localStorage.
  if (!hasHydrated) return null;
  if (resumePending) {
    return (
      <Card className="p-6">
        <p className="text-center text-sm text-zinc-400">กำลังโหลด draft…</p>
      </Card>
    );
  }

  if (resumeFailure) {
    return (
      <>
        {resumeFailure.kind === "forbidden" ? (
          <NoAccess message={resumeFailure.message} />
        ) : (
          <Card className="p-6">
            <p className="text-center text-sm text-red-600 dark:text-red-400">{resumeFailure.message}</p>
          </Card>
        )}
        <div className="mt-4 flex justify-center gap-3">
          {resumeFailure.kind === "retryable" && (
            <Button variant="primary" onClick={handleRetryResume} disabled={retrying}>
              {retrying ? "กำลังโหลด…" : "ลองใหม่"}
            </Button>
          )}
          <Link href="/publications" className={buttonClasses("secondary")}>
            กลับไปยังรายการ
          </Link>
        </div>
      </>
    );
  }

  const displayError = error || resumeError;

  // Arriving with ?id= means the operator deliberately opened an existing draft — never prompt there.
  const showResumePrompt = shouldShowResumePrompt({
    hadContentAtHydration,
    isEditMode: Boolean(idParam),
    dismissed: dismissedResume,
  });

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

      <Modal
        open={showResumePrompt}
        onClose={() => setDismissedResume(true)}
        title="มี draft ที่ทำค้างไว้"
        footer={
          <>
            <Button variant="ghost" onClick={() => { usePublicationDraftStore.getState().cancelDraft(); setDismissedResume(true); }}>
              เริ่มใหม่
            </Button>
            <Button variant="primary" onClick={() => setDismissedResume(true)}>
              ทำต่อ
            </Button>
          </>
        }
      >
        <p>เจอร่าง publication ที่ทำค้างไว้ในเครื่องนี้ — จะทำต่อจากเดิม หรือเริ่มใหม่?</p>
        <p>เริ่มใหม่จะล้างเฉพาะร่างในเครื่อง ร่างที่เคยบันทึกขึ้นระบบแล้วยังอยู่ในหน้า Publications</p>
      </Modal>

      <Modal
        open={(step === 2 || step === 3) && validationErrors.length > 0}
        onClose={() => setValidationErrors([])}
        title={step === 2 ? "ยังไม่ได้เลือกสื่อ" : "ยังไม่ได้เลือกช่องทาง"}
        footer={<Button variant="primary" onClick={() => setValidationErrors([])}>{step === 2 ? "เลือกสื่อ" : "เลือกช่องทาง"}</Button>}
      >
        {validationErrors.map((err, idx) => (<p key={idx}>{err}</p>))}
      </Modal>

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

      {revisionConflict && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>{revisionConflict}</span>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              onClick={handleReloadFromServer}
              disabled={conflictBusy}
            >
              {conflictBusy ? "กำลังโหลด…" : "โหลดใหม่"}
            </Button>
            <Button
              variant="primary"
              className="px-3 py-1.5 text-xs"
              onClick={handleOverwrite}
              disabled={conflictBusy}
            >
              {conflictBusy ? "กำลังโหลด…" : "บันทึกทับ"}
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
            <BasicInfoForm campaigns={campaigns} workspaceTags={tags} showErrors={showFieldErrors} />
          </div>
          <div>
            <PreviewPanel campaigns={campaigns} />
          </div>
        </div>
      )}

      {step === 2 && <ContentStep campaigns={campaigns} />}
      {step === 3 && (
        <ChannelsStep channels={channels} loadingChannels={loadingRefs} channelsError={channelsError} />
      )}
      {step === 4 && (
        <ScheduleStep
          campaigns={campaigns}
          channels={channels}
          assets={assets}
          conflicts={conflicts}
          checkingConflicts={checkingConflicts}
          conflictsError={conflictsError}
          showErrors={showFieldErrors}
        />
      )}
      {step === 5 && (
        <ReviewPublishStep
          campaigns={campaigns}
          channels={channels}
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
