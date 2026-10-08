"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NoAccess } from "@/components/ui/NoAccess";
import { ArrowLeftIcon, ArrowRightIcon, PaperPlaneIcon } from "@/components/ui/icons";
import { wizardSteps } from "../mock-data";
import { useHasHydratedDraft, useIsDraftDirty, usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { Modal } from "@/components/ui/Modal";
import { usePublishDraft } from "../hooks/usePublishDraft";
import { useLayoutAspectRatio } from "../hooks/useLayoutAspectRatio";
import { deletePublication, fetchPublication } from "../services/publications-api";
import { fetchPlaylist } from "@/features/media-workspace/playlists";
import { detailToDraft } from "../detail-mapping";
import { isConflict, classifyApiError, type ClassifiedError } from "@/lib/api/api-error";
import type { PlaylistDetail } from "../types";
import { attemptNext, isResumePending, resumeStep } from "../next-transition";
import { publicationSeedFromParams } from "../seed-resolver";
import { requireCompleteDraftSave } from "../draft-save-policy";
import { useCreateDraftEntry } from "../hooks/useCreateDraftEntry";
import { DraftResumePrompt } from "./DraftResumePrompt";
import { Button as LovableButton } from "@/components/ui/lovable/button";
import { type WizardStepId } from "../step-validation";
import { ContentStep } from "./ContentStep";
import { PrepareContentStep } from "./PrepareContentStep";
import { ProgramStep } from "./ProgramStep";
import { PublicationStepper } from "./PublicationStepper";
import { PublishStep } from "./PublishStep";
import { ReviewStep } from "./ReviewStep";

// A re-opened draft lands where it left off (#199) and keeps every step before it reachable.
function landOnResumeStep() {
  const step = resumeStep(usePublicationDraftStore.getState());
  usePublicationDraftStore.setState({ step, furthestStep: step });
}

// The five ver02 Create steps (ADR 0072 §2):
//   1 Choose Content · 2 Prepare Content · 3 Program · 4 Review · 5 Publish
const MAX_BUILT_STEP = 5;

export function CreatePublicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");
  const seed = useMemo(
    () => publicationSeedFromParams({
      assetId: searchParams.get("assetId"),
      playlistId: searchParams.get("playlistId"),
      compositionId: searchParams.get("compositionId"),
    }),
    [searchParams],
  );

  const hasHydrated = useHasHydratedDraft();
  const isDirty = useIsDraftDirty();
  const step = usePublicationDraftStore((s) => s.step);
  const furthestStep = usePublicationDraftStore((s) => s.furthestStep);
  const publicationId = usePublicationDraftStore((s) => s.publicationId);
  const draftName = usePublicationDraftStore((s) => s.basicInfo.name);
  const goNextAction = usePublicationDraftStore((s) => s.goNext);
  const goBack = usePublicationDraftStore((s) => s.goBack);

  const setPublicationId = usePublicationDraftStore((s) => s.setPublicationId);
  const setStep = usePublicationDraftStore((s) => s.setStep);
  const setBasicInfo = usePublicationDraftStore((s) => s.setBasicInfo);
  const setAssetItems = usePublicationDraftStore((s) => s.setAssetItems);
  const setChannelIds = usePublicationDraftStore((s) => s.setChannelIds);
  const setGroupIds = usePublicationDraftStore((s) => s.setGroupIds);
  const setGroupNamesById = usePublicationDraftStore((s) => s.setGroupNamesById);
  const setSchedule = usePublicationDraftStore((s) => s.setSchedule);
  const compositionId = usePublicationDraftStore((s) => s.compositionId);
  const { aspectRatio: layoutAspectRatio, failed: fitCheckFailed } = useLayoutAspectRatio(compositionId);

  const [resumedId, setResumedId] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeFailure, setResumeFailure] = useState<ClassifiedError | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const loadedIdRef = useRef<string | null>(null);

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
      usePublicationDraftStore.getState().setPlaylistId(draft.playlistId);
      setAssetItems(draft.assetItems);
      setChannelIds(draft.channelIds);
      setGroupIds(draft.groupIds);
      setGroupNamesById(draft.groupNamesById);
      setSchedule(draft.schedule);
      usePublicationDraftStore.getState().setCompositionId(draft.compositionId);
      setPublicationId(detail.id);
      usePublicationDraftStore.getState().setRevision(detail.revision ?? null);
      usePublicationDraftStore.getState().markSaved();
      usePublicationDraftStore.getState().setExplicitlySaved(true);
    },
    [setBasicInfo, setAssetItems, setChannelIds, setGroupIds, setGroupNamesById, setSchedule, setPublicationId]
  );

  useEffect(() => {
    if (!hasHydrated) return;
    if (!idParam) return;
    // Read, not a dependency: the load itself sets publicationId, and re-running on that
    // would cancel this very effect before it lands on the resume step (#199).
    if (idParam === usePublicationDraftStore.getState().publicationId) return;
    if (loadedIdRef.current === idParam) return;

    loadedIdRef.current = idParam;
    let alive = true;

    const load = async () => {
      setResumeFailure(null);
      try {
        await loadPublicationIntoDraft(idParam);
        if (!alive) return;
        landOnResumeStep();
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
  }, [hasHydrated, idParam, loadPublicationIntoDraft]);

  const [retrying, setRetrying] = useState(false);

  const handleRetryResume = async () => {
    if (!idParam || retrying) return;
    setRetrying(true);
    setResumeFailure(null);
    try {
      await loadPublicationIntoDraft(idParam);
      landOnResumeStep();
    } catch (err) {
      setResumeFailure(classifyApiError(err, "โหลด draft ไม่สำเร็จ"));
    } finally {
      setRetrying(false);
    }
  };

  const {
    channels,
    channelsError,
    tags,
    assets,
    reloadAssets,
    assetsLoading,
    assetsError,
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
    publishNow,
    canPublish,
    eligibilityChecks,
    persistDraft,
    saveDraft,
    saveStatus,
    setSaveStatus,
    savingNext,
    setSavingNext,
  } = usePublishDraft();

  const entry = useCreateDraftEntry({
    hasHydrated, idParam, seed, assets, assetsLoading, assetsError,
    loadingChannels: loadingRefs, channelsError, revisionConflict, setRevisionConflict, persistDraft,
  });

  const persistForNavigation = async () => {
    const result = await persistDraft(false);
    if (result.kind === "skipped") {
      if (step !== 1 || publicationId) requireCompleteDraftSave(result);
      return false;
    }
    router.replace(`/media-workspace/program/create?id=${encodeURIComponent(result.publicationId)}`);
    // ADR 0086 §2: a withheld invalid schedule stays dirty but must not block the way back to fix it.
    if (!result.isComplete) return false;
    usePublicationDraftStore.getState().markSaved(result.draft);
    return true;
  };

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
    router.push("/media-workspace/program");
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
    let didSave = false;
    const outcome = await attemptNext(
      step as WizardStepId,
      usePublicationDraftStore.getState(),
      async () => {
        // Only reached when the step validates, so the "saving" flip and the
        // stale-error clear both land at the same moment they used to.
        setValidationErrors([]);
        setShowFieldErrors(false);
        setSavingNext(true);
        setSaveStatus("saving");
        didSave = await persistForNavigation();
      }
    );

    if (outcome.kind === "invalid") {
      setValidationErrors(outcome.errors);
      // Prepare Content (name) and Program (schedule) show their errors inline.
      if (step === 2 || step === 3) setShowFieldErrors(true);
      return;
    }
    setSavingNext(false);
    if (outcome.kind === "saved") {
      setSaveStatus(didSave ? "saved" : "idle");
      setError(null); // clear a stale error from a prior failed attempt (e.g. Retry succeeding)
      goNextAction(MAX_BUILT_STEP);
    } else {
      setSaveStatus("error");
      // The revision-conflict banner already shows this — avoid saying it twice.
      if (!isConflict(outcome.message)) setError(outcome.message);
    }
  };

  // #226: a stepper jump on a server draft saves first, like Next — otherwise a content change
  // made before the jump lives only in this browser.
  const handleStepSelect = async (target: number) => {
    if (publicationId && isDirty) {
      try {
        await persistForNavigation();
      } catch (err) {
        const message = err instanceof Error ? err.message : "บันทึก draft ไม่สำเร็จ";
        // The revision-conflict banner already shows a conflict.
        if (!isConflict(message)) setError(message);
        return;
      }
    }
    setStep(target);
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
  if (resumePending || entry.isInitializing) {
    return (
      <Card className="p-6">
        <p className="text-center text-sm text-muted-foreground">กำลังโหลด draft…</p>
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
            <p className="text-center text-sm text-danger">{resumeFailure.message}</p>
          </Card>
        )}
        <div className="mt-4 flex justify-center gap-3">
          {resumeFailure.kind === "retryable" && (
            <Button variant="primary" onClick={handleRetryResume} disabled={retrying}>
              {retrying ? "กำลังโหลด…" : "ลองใหม่"}
            </Button>
          )}
          <Link href="/media-workspace/program" className={buttonClasses("secondary")}>
            กลับไปยังรายการ
          </Link>
        </div>
      </>
    );
  }

  const displayError = error || resumeError || entry.seedError;
  return (
    <div className="flex min-h-[calc(100dvh-7rem)] flex-col gap-6">
      <PageHeader
        title="Create Publication"
        subtitle="สร้างและเผยแพร่สื่อไปยังทุกช่องทางของคุณ"
      />

      <DraftResumePrompt {...entry.prompt} />

      <Modal
        open={(step === 1 || step === 3) && validationErrors.length > 0}
        onClose={() => setValidationErrors([])}
        title={step === 1 ? "ยังไม่ได้เลือกคอนเทนต์" : "ข้อมูล Program ยังไม่ครบ"}
        footer={<Button variant="primary" onClick={() => setValidationErrors([])}>ตกลง</Button>}
      >
        {validationErrors.map((err, idx) => (<p key={idx}>{err}</p>))}
      </Modal>

      {confirmingCancel && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
          <span>มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ออกจากหน้านี้จะทำให้ข้อมูลหายไป ดำเนินการต่อ?</span>
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setConfirmingCancel(false)}>
              Stay
            </Button>
            <Button
              variant="primary"
              className="bg-danger px-3 py-1.5 text-xs hover:bg-danger"
              onClick={performCancel}
              disabled={cancelBusy}
            >
              {cancelBusy ? "Leaving…" : "Leave"}
            </Button>
          </div>
        </div>
      )}

      {revisionConflict && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
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
        <PublicationStepper currentStep={step} furthestStep={furthestStep} onStepSelect={(target) => void handleStepSelect(target)} />
      </Card>

      {/* Step 1 — Choose Content */}
      {step === 1 && (
        <ContentStep
          assets={assets}
          tags={tags}
          reloadAssets={reloadAssets}
          assetsLoading={assetsLoading}
          assetsError={assetsError}
          onContentSelected={() => void handleNext()}
        />
      )}

      {/* Step 2 — Prepare Content */}
      {step === 2 && <PrepareContentStep assets={assets} tags={tags} showFieldErrors={showFieldErrors} />}

      {/* Step 3 — Program: Where / When / How + Additional Settings (ver02 Frame 3, #84) */}
      {step === 3 && (
        <ProgramStep
          channels={channels}
          loadingChannels={loadingRefs}
          channelsError={channelsError}
          aspectRatio={layoutAspectRatio}
          fitCheckFailed={fitCheckFailed}
          assets={assets}
          conflicts={conflicts}
          checkingConflicts={checkingConflicts}
          conflictsError={conflictsError}
          showFieldErrors={showFieldErrors}
        />
      )}

      {step === 4 && (
        <ReviewStep
          channels={channels}
          assets={assets}
          conflicts={conflicts}
          checkingConflicts={checkingConflicts}
          conflictsError={conflictsError}
          eligibilityChecks={eligibilityChecks}
          aspectRatio={layoutAspectRatio}
          fitCheckFailed={fitCheckFailed}
          onEditProgram={() => setStep(3)}
        />
      )}

      {step === 5 && <PublishStep channels={channels} assets={assets} canPublish={canPublish} />}

      <Card className="mt-auto flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {step > 1 ? (
            <Button variant="secondary" onClick={goBack}>
              <ArrowLeftIcon className="h-4 w-4" /> Back{prevStepLabel ? `: ${prevStepLabel}` : ""}
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleCancelClick} disabled={cancelBusy}>Cancel</Button>
          )}
          <div className="flex min-w-48 flex-1 items-center gap-3">
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {step} of {wizardSteps.length} steps completed
            </span>
            <div className="h-1.5 flex-1 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(step / wizardSteps.length) * 100}%` }}
              />
            </div>
          </div>
          <LovableButton
            variant="outline"
            disabled={saving || !draftName.trim()}
            onClick={() => void saveDraft()}
          >
            {saving ? "Saving…" : "Save draft"}
          </LovableButton>
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
            <p className="text-xs font-medium text-danger">{displayError}</p>
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
          <p className="text-xs font-medium text-success">
            Published successfully! (ID: {publishedId})
          </p>
        )}
      </Card>
    </div>
  );
}
