"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { Button } from "@/components/ui/lovable/button";
import { ArrowLeftIcon, ArrowRightIcon, InfoIcon } from "@/components/ui/icons";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { REGISTRATION_STEPS } from "../../domain/registration-draft";
import { useAssetRegistration } from "../../hooks/use-asset-registration";
import { registrationDraftKey } from "../../services/asset-registration-draft-storage";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { LoadingState } from "../states/states";
import { BasicInformationStep } from "./BasicInformationStep";
import { CategorySpecificationStep } from "./CategorySpecificationStep";
import { LocationOwnershipStep } from "./LocationOwnershipStep";
import { PurchaseWarrantyStep } from "./PurchaseWarrantyStep";
import { RegistrationReviewStep } from "./RegistrationReviewStep";
import { RegistrationPreview } from "./RegistrationPreview";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function SingleAssetWizard(props: { options: RegistrationOptions; tenantId: string; userId: string }) {
  // The server cannot read tab storage. Mount the draft form only after hydration, without replacing saved data.
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  if (!ready) return <LoadingState rows={8} />;
  return <RegistrationForm key={`${props.tenantId}:${props.userId}`} {...props} />;
}

function RegistrationForm({ options, tenantId, userId }: { options: RegistrationOptions; tenantId: string; userId: string }) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const registration = useAssetRegistration(registrationDraftKey(tenantId, userId), options);
  const { state, errors, patch } = registration;
  const stepProps = { draft: state.draft, options, errors, patch };
  const Step = [BasicInformationStep, CategorySpecificationStep, LocationOwnershipStep, PurchaseWarrantyStep][state.step];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [state.step, state.editing]);

  function leave() {
    if (registration.discard()) router.push("/asset-workspace/assets");
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0 space-y-3">
        <PageHeader title="Register Asset" subtitle={state.step === 4 ? "Review all information before creating the asset. You can edit any section." : "Add a new asset to your organization. Complete the information below."} />
        <WizardSteps steps={REGISTRATION_STEPS} currentIndex={state.step} />
        <div className="flex items-start gap-3 rounded-control bg-info-muted p-3 text-info" role="status">
          <InfoIcon className="h-4 w-4" />
          <p className="text-xs">You can prepare and review this registration. Creating the asset is not available yet; no asset has been saved.</p>
        </div>
        {registration.storageUnavailable && (
          <p role="alert" className="rounded-control bg-warning-muted p-3 text-xs text-warning">Browser draft storage is unavailable. Your latest changes may be lost on refresh.</p>
        )}
        {(!options.categories.length || !options.locations.length) && (
          <p role="status" className="rounded-control bg-warning-muted p-3 text-xs text-warning">An active category and location are required. Ask your administrator to configure the missing registration options.</p>
        )}
      </div>
      <form ref={formRef} className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={(event) => {
        event.preventDefault();
        if (state.step === 4) return;
        const advanced = registration.advance();
        requestAnimationFrame(() => {
          if (!advanced) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
          else scrollRef.current?.scrollTo({ top: 0 });
        });
      }}>
        <div ref={scrollRef} data-registration-scroll className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4 pr-1">
          <h2 ref={headingRef} tabIndex={-1} className="mb-3 text-sm font-semibold outline-none sm:sr-only">
            Step {state.step + 1}: {REGISTRATION_STEPS[state.step]}{state.editing ? " — editing" : ""}
          </h2>
          {Object.keys(errors).length > 0 && <p role="alert" className="mb-3 text-xs text-error">Check the highlighted fields before continuing.</p>}
          <div className="grid items-start gap-3 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              {state.step === 4 ? (
                <RegistrationReviewStep draft={state.draft} options={options} onEdit={registration.edit} />
              ) : (
                <Step {...stepProps} />
              )}
            </div>
            <RegistrationPreview draft={state.draft} options={options} step={state.step} reviewed={state.reviewed} onEdit={registration.edit} />
          </div>
        </div>
        <footer data-registration-footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-3 py-3">
          <Button variant="outline" size="sm" onClick={() => registration.dirty ? registration.setCancelOpen(true) : leave()}>Cancel</Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={state.step === 0} onClick={registration.back}>
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </Button>
            {state.step === 4 ? (
              <Button size="sm" disabled aria-describedby="registration-create-reason">Create Asset</Button>
            ) : (
              <Button type="submit" size="sm">
                {state.editing ? "Update" : "Next"}
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
          {state.step === 4 && <p id="registration-create-reason" className="w-full text-xs text-muted-foreground">{options.submission.canSubmit ? "Asset creation requires a separately confirmed writer integration and is not enabled in this version." : "Asset creation is temporarily unavailable. Your draft remains available in this tab."}</p>}
        </footer>
      </form>
      <AlertDialog open={registration.cancelOpen} onOpenChange={registration.setCancelOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] rounded-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{registration.discardFailed ? "Couldn't clear this draft" : "Discard this registration?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {registration.discardFailed
                ? "Browser storage could not be cleared. A saved draft may remain in this tab. Try again, keep editing, or leave without clearing it. No asset has been created."
                : "Your draft will be removed from this tab. No asset has been created."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            {registration.discardFailed && (
              <Button variant="outline" onClick={() => {
                registration.setCancelOpen(false);
                router.push("/asset-workspace/assets");
              }}>Leave anyway</Button>
            )}
            <AlertDialogAction onClick={(event) => {
              if (!registration.discard()) event.preventDefault();
              else router.push("/asset-workspace/assets");
            }}>{registration.discardFailed ? "Try again" : "Discard draft"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
