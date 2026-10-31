"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { WizardSteps } from "@/components/ui/WizardSteps";
import { Button } from "@/components/ui/lovable/button";
import { InfoIcon } from "@/components/ui/icons";
import { RegistrationNavigation, RegistrationCancelDialog } from "./RegistrationNavigation";
import { REGISTRATION_STEPS } from "../../domain/registration-draft";
import { useAssetRegistration } from "../../hooks/use-asset-registration";
import { useRegistrationPhotos } from "../../hooks/use-registration-photos";
import { useRegistrationDocuments } from "../../hooks/use-registration-documents";
import { registrationDraftKey } from "../../services/asset-registration-draft-storage";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { RegistrationLoading } from "./RegistrationLoading";
import { BasicInformationStep } from "./BasicInformationStep";
import { CategorySpecificationStep } from "./CategorySpecificationStep";
import { LocationOwnershipStep } from "./LocationOwnershipStep";
import { AcquisitionWarrantyStep } from "./AcquisitionWarrantyStep";
import { RegistrationReviewStep } from "./RegistrationReviewStep";
import { RegistrationPreview } from "./RegistrationPreview";
import { RegistrationPhotos } from "./RegistrationPhotos";
import { RegistrationConfirmation, RegistrationReceipt } from "./RegistrationConfirmation";
import { useRegistrationConfirmation } from "../../hooks/use-registration-confirmation";
import { missingRegistrationFiles, validReceipt, type UploadCandidate } from "../../domain/registration-confirmation";
import { removeRegistrationDraft } from "../../services/asset-registration-draft-storage";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function SingleAssetWizard(props: { options: RegistrationOptions; tenantId: string; userId: string }) {
  // The server cannot read tab storage. Mount the draft form only after hydration, without replacing saved data.
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  if (!ready) return <RegistrationLoading />;
  return <RegistrationSession {...props} />;
}

function RegistrationSession(props: { options: RegistrationOptions; tenantId: string; userId: string }) {
  const [generation, setGeneration] = useState(0);
  return <RegistrationForm key={`${props.tenantId}:${props.userId}:${generation}`} {...props} onRestart={() => setGeneration((value) => value + 1)} />;
}

function RegistrationForm({ options: initialOptions, tenantId, userId, onRestart }: { options: RegistrationOptions; tenantId: string; userId: string; onRestart: () => void }) {
  const router = useRouter();
  const [recoveryClearFailed, setRecoveryClearFailed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storageKey = registrationDraftKey(tenantId, userId);
  const confirmation = useRegistrationConfirmation(`${storageKey}:confirmation`, `${tenantId}:${userId}`, initialOptions);
  const { locked } = confirmation;
  const options = confirmation.options ?? initialOptions;
  const registration = useAssetRegistration(storageKey, options);
  const { state: editableState, errors, patch } = registration;
  const state = confirmation.uncertain && confirmation.record
    ? { ...editableState, step: 4, draft: confirmation.record.draft } : editableState;
  const receipts = confirmation.record?.uploads ?? [];
  const verifiedFiles = receipts.filter(validReceipt);
  const retainedFor = (ids: string[]) => verifiedFiles.filter((file) => ids.includes(file.localId)).map((file) => ({ id: file.localId, filename: file.filename, size: file.size }));
  const retainedPhotos = retainedFor(state.draft.photoSelectionIds);
  const retainedDocuments = Object.fromEntries([
    ["asset", retainedFor(state.draft.documentSelectionIds)],
    ...state.draft.warranties.map((warranty) => [warranty.clientId, retainedFor(warranty.documentSelectionIds)]),
  ]);
  const photoSelection = useRegistrationPhotos(options.photoUpload, (hasPhotoSelections, photoSelectionIds) => patch({ hasPhotoSelections, photoSelectionIds }), retainedPhotos);
  const documents = useRegistrationDocuments(options.documentUpload, (target, hasDocumentSelections, documentSelectionIds) => {
    if (target === "asset") patch({ hasDocumentSelections, documentSelectionIds });
    else patch({ warranties: state.draft.warranties.map((warranty) => warranty.clientId === target ? { ...warranty, hasDocumentSelections, documentSelectionIds } : warranty) });
  }, retainedDocuments, Object.fromEntries([
    ["asset", state.draft.documentSelectionIds],
    ...state.draft.warranties.map((warranty) => [warranty.clientId, warranty.documentSelectionIds]),
  ]));
  const candidates: UploadCandidate[] = [
    ...photoSelection.photos.map((photo) => ({ localId: photo.id, file: photo.file, purpose: "asset_photo" as const })),
    ...Object.entries(documents.groups).filter(([target]) => target === "asset" || state.draft.warranties.some((warranty) => warranty.clientId === target))
      .flatMap(([target, group]) => group.files.map((document) => ({ localId: document.id, file: document.file,
        purpose: target === "asset" ? "asset_document" as const : "warranty_document" as const,
        warrantyClientId: target === "asset" ? undefined : target }))),
  ];
  const needsPhotoReselection = state.draft.hasPhotoSelections && photoSelection.photos.length === 0
    && (!state.draft.photoSelectionIds.length || !state.draft.photoSelectionIds.every((id) => verifiedFiles.some((file) => file.localId === id)));
  const missingFiles = missingRegistrationFiles(state.draft, candidates, receipts);
  const edit = (step: number) => { if (!locked) registration.edit(step); };
  const stepProps = { draft: state.draft, options, errors, patch, documents, onReviewCondition: () => edit(0) };
  const Step = [BasicInformationStep, CategorySpecificationStep, LocationOwnershipStep, AcquisitionWarrantyStep][state.step];
  const submit = (reason?: string) => confirmation.start(state.draft, candidates, registration.validateForConfirmation, reason);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [state.step, state.editing]);

  function discard() {
    if (locked) return false;
    if (!confirmation.discard()) { setRecoveryClearFailed(true); registration.setCancelOpen(true); return false; }
    return registration.discard();
  }
  function leave() { if (discard()) router.push("/asset-workspace/assets"); }

  if (confirmation.record?.phase === "succeeded" && confirmation.record.result) {
    return (
      <RegistrationReceipt result={confirmation.record.result} onBack={() => router.push("/asset-workspace/assets")} onAnother={() => {
        if (!removeRegistrationDraft(storageKey) || !confirmation.discard()) return false;
        onRestart();
        return true;
      }} />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0 space-y-3">
        <PageHeader title="Register Asset" subtitle={state.step === 4 ? "Review all information before creating the asset. You can edit any section." : "Add a new asset to your organization. Complete the information below."} />
        <WizardSteps steps={REGISTRATION_STEPS} currentIndex={state.step} />
        <div className="flex items-start gap-3 rounded-control bg-info-muted p-3 text-info" role="status">
          <InfoIcon className="h-4 w-4" />
          <p className="text-xs">{options.submission.canSubmit ? "Review your information, then confirm to upload files and create the asset." : "You can prepare and review this registration. Asset creation is temporarily unavailable."}</p>
        </div>
        {confirmation.storageBlocked && state.step !== 4 && (
          <div role="alert" className="space-y-2 rounded-control bg-warning-muted p-3 text-xs text-warning">
            <p>Recovery storage is unavailable. Restore it before continuing this registration.</p>
            <Button variant="outline" size="sm" onClick={confirmation.retryStorage}>Retry recovery storage</Button>
          </div>
        )}
        {registration.storageUnavailable && (
          <p role="alert" className="rounded-control bg-warning-muted p-3 text-xs text-warning">Browser draft storage is unavailable. Your latest changes may be lost on refresh.</p>
        )}
        {(!options.categories.length || !options.locations.length) && (
          <p role="status" className="rounded-control bg-warning-muted p-3 text-xs text-warning">An active category and location are required. Ask your administrator to configure the missing registration options.</p>
        )}
      </div>
      <form ref={formRef} className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={(event) => {
        event.preventDefault();
        if (locked && !confirmation.uncertain) return;
        if (state.step === 4) { void submit(); return; }
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
                <RegistrationReviewStep draft={state.draft} options={options} onEdit={edit} locked={locked} photoCount={photoSelection.photos.length} needsPhotoReselection={needsPhotoReselection} documentGroups={documents.groups} verifiedFiles={verifiedFiles} />
              ) : (
                <Step {...stepProps} />
              )}
            </div>
            <div className="min-w-0 space-y-3">
              {state.step === 0 && (
                <RegistrationPhotos
                  photos={photoSelection.photos} retained={retainedPhotos} errors={photoSelection.errors} rules={options.photoUpload}
                  needsReselection={needsPhotoReselection} onSelect={photoSelection.select} onRemove={photoSelection.remove}
                  onClearReminder={() => patch({ hasPhotoSelections: false, photoSelectionIds: [] })}
                />
              )}
              <RegistrationPreview
                draft={state.draft} options={options} step={state.step} reviewed={state.reviewed} onEdit={edit} locked={locked}
                photo={photoSelection.photos[0]} needsPhotoReselection={needsPhotoReselection}
                verifiedPhoto={Boolean(retainedPhotos.length)}
              />
              {state.step === 4 && (
                <RegistrationConfirmation confirmation={confirmation} missingFiles={missingFiles} serialNumber={state.draft.serialNumber} onOverride={(reason) => { void submit(reason); }} onLeave={() => router.push("/asset-workspace/assets")} />
              )}
            </div>
          </div>
        </div>
        <RegistrationNavigation
          step={state.step} editing={state.editing} locked={locked} busy={confirmation.busy} uncertain={confirmation.uncertain}
          canConfirm={!confirmation.storageBlocked && (confirmation.uncertain || options.submission.canSubmit && !missingFiles)}
          onCancel={() => registration.dirty ? registration.setCancelOpen(true) : leave()}
          onBack={() => { if (!locked) registration.back(); }}
        />
      </form>
      <RegistrationCancelDialog
        open={registration.cancelOpen} onOpenChange={(open) => { registration.setCancelOpen(open); if (!open) setRecoveryClearFailed(false); }}
        failed={registration.discardFailed || recoveryClearFailed} onDiscard={discard}
        onLeave={() => router.push("/asset-workspace/assets")}
      />
    </div>
  );
}
