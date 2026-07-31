"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeftIcon, ArrowRightIcon, PaperPlaneIcon } from "@/components/ui/icons";
import { wizardSteps } from "../mock-data";
import { useHasHydratedDraft, usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { usePublishDraft } from "../hooks/usePublishDraft";
import { fetchPlaylist, fetchPublication } from "../services/publications-api";
import { detailToDraft } from "../detail-mapping";
import type { PlaylistDetail } from "../types";
import { BasicInfoForm } from "./BasicInfoForm";
import { ChannelsStep } from "./ChannelsStep";
import { ContentStep } from "./ContentStep";
import { PreviewPanel } from "./PreviewPanel";
import { PublicationStepper } from "./PublicationStepper";
import { ReviewPublishStep } from "./ReviewPublishStep";
import { ScheduleStep } from "./ScheduleStep";

const MAX_BUILT_STEP = 5;

export function CreatePublicationPage() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id");

  const hasHydrated = useHasHydratedDraft();
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
  const loadedIdRef = useRef<string | null>(null);

  // Derived, not state: `resumedId` only settles once the fetch has finished, so
  // the wizard never paints the *previous* draft's values before ?id= replaces
  // them. Starting from a boolean that flips inside the effect would show one
  // frame of the wrong publication.
  const resumePending = Boolean(idParam) && idParam !== resumedId && idParam !== publicationId;

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
    campaigns,
    assets,
    loadingRefs,
    saving,
    error,
    publishedId,
    conflicts,
    checkingConflicts,
    saveDraft,
    publishNow,
    canPublish,
  } = usePublishDraft();

  const goNext = () => goNextAction(MAX_BUILT_STEP);
  const isLastStep = step === wizardSteps.length;
  const nextStepLabel = wizardSteps[step]?.label ?? wizardSteps[wizardSteps.length - 1].label;
  const prevStepLabel = wizardSteps[step - 2]?.label;

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
              <Button variant="secondary" onClick={goBack}>
                <ArrowLeftIcon className="h-4 w-4" /> Back{prevStepLabel ? `: ${prevStepLabel}` : ""}
              </Button>
              <Button variant="primary" onClick={publishNow} disabled={saving || !canPublish}>
                <PaperPlaneIcon className="h-4 w-4" /> {saving ? "Publishing…" : "Publish Now"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={saveDraft} disabled={saving}>
                {saving ? "Saving…" : "Save as Draft"}
              </Button>
              <Button variant="primary" onClick={goNext} disabled={step >= MAX_BUILT_STEP}>
                Next: {nextStepLabel} <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </>
          )
        }
      />

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
      {step === 3 && <ChannelsStep screens={screens} loadingScreens={loadingRefs} />}
      {step === 4 && (
        <ScheduleStep
          campaigns={campaigns}
          screens={screens}
          assets={assets}
          conflicts={conflicts}
          checkingConflicts={checkingConflicts}
        />
      )}
      {step === 5 && (
        <ReviewPublishStep
          campaigns={campaigns}
          screens={screens}
          assets={assets}
          conflicts={conflicts}
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
            <Button variant="primary" onClick={goNext} disabled={step >= MAX_BUILT_STEP}>
              Next: {nextStepLabel} <ArrowRightIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        {displayError && <p className="text-xs font-medium text-red-600">{displayError}</p>}
        {publishedId && (
          <p className="text-xs font-medium text-emerald-600">
            Published successfully! (ID: {publishedId})
          </p>
        )}
      </Card>
    </div>
  );
}
