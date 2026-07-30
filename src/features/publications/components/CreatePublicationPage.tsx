"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeftIcon, ArrowRightIcon, PaperPlaneIcon } from "@/components/ui/icons";
import { wizardSteps } from "../mock-data";
import { useHasHydratedDraft, usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { usePublishDraft } from "../hooks/usePublishDraft";
import { BasicInfoForm } from "./BasicInfoForm";
import { ChannelsStep } from "./ChannelsStep";
import { ContentStep } from "./ContentStep";
import { PreviewPanel } from "./PreviewPanel";
import { PublicationStepper } from "./PublicationStepper";
import { ReviewPublishStep } from "./ReviewPublishStep";
import { ScheduleStep } from "./ScheduleStep";

const MAX_BUILT_STEP = 5;

export function CreatePublicationPage() {
  const hasHydrated = useHasHydratedDraft();
  const step = usePublicationDraftStore((s) => s.step);
  const goNextAction = usePublicationDraftStore((s) => s.goNext);
  const goBack = usePublicationDraftStore((s) => s.goBack);

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
  // later step) loads from localStorage.
  if (!hasHydrated) return null;

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
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        {publishedId && (
          <p className="text-xs font-medium text-emerald-600">
            Published successfully! (ID: {publishedId})
          </p>
        )}
      </Card>
    </div>
  );
}
