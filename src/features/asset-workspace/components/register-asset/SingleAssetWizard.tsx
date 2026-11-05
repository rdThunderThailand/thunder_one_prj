"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/lovable/button";
import { InfoIcon } from "@/components/ui/icons";
import { RegistrationNavigation, RegistrationCancelDialog } from "./RegistrationNavigation";
import { REGISTRATION_STEPS } from "../../domain/registration-draft";
import { useRegistrationReferences } from "../../hooks/use-registration-references";
import { RegistrationReferenceState } from "./RegistrationReferenceState";
import { useAssetRegistration } from "../../hooks/use-asset-registration";
import { useRegistrationPhotos } from "../../hooks/use-registration-photos";
import { useRegistrationDocuments } from "../../hooks/use-registration-documents";
import { useRegistrationFileCache } from "../../hooks/use-registration-file-cache";
import { RegistrationFileStorageState } from "./RegistrationFileStorageState";
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
import { registrationCreationBlocker } from "../../domain/registration-readiness";
import { RegistrationWorkspace } from "./RegistrationWorkspace";
import { RegistrationHeader } from "./RegistrationHeader";

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
  const [discarded, setDiscarded] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const storageKey = registrationDraftKey(tenantId, userId);
  const confirmation = useRegistrationConfirmation(`${storageKey}:confirmation`, `${tenantId}:${userId}`, initialOptions);
  const { locked } = confirmation;
  const rules = confirmation.options ?? initialOptions;
  const registration = useAssetRegistration(storageKey, rules);
  const { state: editableState, errors, patch } = registration;
  const state = confirmation.uncertain && confirmation.record
    ? { ...editableState, step: 4, draft: confirmation.record.draft } : editableState;
  const references = useRegistrationReferences(`${tenantId}:${userId}`, state.draft,
    confirmation.uncertain || confirmation.record?.phase === "succeeded" ? -1 : state.step, patch);
  const options = { ...rules, referenceValidation: references.validation };
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
  const fileCache = useRegistrationFileCache({
    key: storageKey, draft: state.draft, options, files: candidates,
    succeeded: confirmation.record?.phase === "succeeded",
    restore: (files) => { photoSelection.restore(files); documents.restore(files); },
  });
  const needsPhotoReselection = state.draft.hasPhotoSelections && (!state.draft.photoSelectionIds.length
    || state.draft.photoSelectionIds.some((id) => !photoSelection.photos.some((file) => file.id === id) && !retainedPhotos.some((file) => file.id === id)));
  const missingFiles = missingRegistrationFiles(state.draft, candidates, receipts);
  const creationBlocker = registrationCreationBlocker(state.draft, options, receipts);
  const edit = (step: number) => { if (!locked) registration.edit(step); };
  const stepProps = { context: `${tenantId}:${userId}`, onSelectReference: references.select, draft: state.draft, options, errors, patch, documents, onReviewCondition: () => edit(0) };
  const Step = [BasicInformationStep, CategorySpecificationStep, LocationOwnershipStep, AcquisitionWarrantyStep][state.step];
  const submit = (reason?: string) => {
    if (!fileCache.restoring || confirmation.uncertain) {
      return confirmation.start(state.draft, candidates, (resolved, validatedOptions, invalidStep) => {
        references.accept(validatedOptions.referenceValidation ?? {});
        registration.validateForConfirmation(resolved, validatedOptions, invalidStep);
      }, reason);
    }
  };

  // A created asset ends this registration: drop its draft so the next visit starts a new one.
  // The receipt keeps rendering from memory; file bytes are cleared by the file cache.
  const succeeded = confirmation.record?.phase === "succeeded";
  useEffect(() => {
    if (succeeded) removeRegistrationDraft(storageKey);
  }, [succeeded, storageKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    scrollRef.current?.querySelector("[data-registration-form-scroll]")?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [state.step, state.editing, fileCache.initializing]);

  async function discard() {
    if (locked) return false;
    if (!confirmation.discard()) { setRecoveryClearFailed(true); registration.setCancelOpen(true); return false; }
    if (!registration.discard()) return false;
    if (await fileCache.clear()) router.push("/asset-workspace/assets");
    else setDiscarded(true);
    return true;
  }

  if (confirmation.record?.phase === "succeeded" && confirmation.record.result) {
    return (
      <RegistrationReceipt
        result={confirmation.record.result} draft={confirmation.record.draft} options={options} photo={photoSelection.photos[0]}
        onBack={() => router.push("/asset-workspace/assets")} onAnother={async () => {
        if (!removeRegistrationDraft(storageKey) || !confirmation.discard()) return false;
        await fileCache.clear();
        onRestart();
        return true;
      }}>
        <RegistrationFileStorageState cache={fileCache} />
      </RegistrationReceipt>
    );
  }

  if (discarded) {
    return (
      <section className="h-full space-y-4 overflow-y-auto overscroll-contain">
        <PageHeader title="Registration discarded" subtitle="Your registration draft has been removed from this tab." />
        <RegistrationFileStorageState cache={fileCache} />
        <Button variant="outline" onClick={() => router.push("/asset-workspace/assets")}>Back to Assets</Button>
      </section>
    );
  }
  if (fileCache.initializing && !confirmation.uncertain) return <RegistrationLoading />;

  const header = (
    <div className="shrink-0 space-y-3">
      <RegistrationHeader step={state.step} />
      {!options.submission.canSubmit && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
          <InfoIcon className="h-4 w-4 shrink-0 text-info" />
          Asset creation is temporarily unavailable.
        </p>
      )}
      {confirmation.storageBlocked && state.step !== 4 && (
        <div role="alert" className="space-y-2 rounded-control bg-warning-muted p-3 text-xs text-warning">
          <p>Recovery storage is unavailable. Restore it before continuing this registration.</p>
          <Button variant="outline" size="sm" onClick={confirmation.retryStorage}>
            Retry recovery storage
          </Button>
        </div>
      )}
      {registration.storageUnavailable && (
        <p role="alert" className="rounded-control bg-warning-muted p-3 text-xs text-warning">
          Browser draft storage is unavailable. Your latest changes may be lost on refresh.
        </p>
      )}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-3" onInputCapture={fileCache.touch} onPointerDownCapture={fileCache.touch}>
      {state.step !== 0 && header}
      <form ref={formRef} className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={(event) => {
        event.preventDefault();
        if (locked && !confirmation.uncertain) return;
        if (state.step === 4) { void submit(); return; }
        const advanced = registration.advance(options);
        requestAnimationFrame(() => {
          if (!advanced) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
          else {
            scrollRef.current?.scrollTo({ top: 0 });
            scrollRef.current?.querySelector("[data-registration-form-scroll]")?.scrollTo({ top: 0 });
          }
        });
      }}>
        <RegistrationWorkspace
          scrollRef={scrollRef}
          basicInformation={state.step === 0}
          header={state.step === 0 ? header : undefined}
          photos={state.step === 0 && (
            <RegistrationPhotos
              photos={photoSelection.photos} retained={retainedPhotos} errors={photoSelection.errors} rules={options.photoUpload}
              needsReselection={needsPhotoReselection} onSelect={photoSelection.select} onRemove={photoSelection.remove}
              onClearReminder={() => {
                const ids = state.draft.photoSelectionIds.filter((id) => photoSelection.photos.some((photo) => photo.id === id) || retainedPhotos.some((photo) => photo.id === id));
                patch({ hasPhotoSelections: ids.length > 0, photoSelectionIds: ids });
              }}
            />
          )}
          preview={(
            <RegistrationPreview
              draft={state.draft} options={options} step={state.step} reviewed={state.reviewed} onEdit={edit} locked={locked}
              photo={photoSelection.photos[0]} needsPhotoReselection={needsPhotoReselection}
              verifiedPhoto={Boolean(retainedPhotos.length)}
            />
          )}
        >
          <RegistrationFileStorageState cache={fileCache} />
          <h2 ref={headingRef} tabIndex={-1} className="mb-3 text-sm font-semibold outline-none sm:sr-only">
            Step {state.step + 1}: {REGISTRATION_STEPS[state.step]}{state.editing ? " — editing" : ""}
          </h2>
          {Object.keys(errors).length > 0 && <p role="alert" className="mb-3 text-xs text-error">Check the highlighted fields before continuing.</p>}
          {missingFiles && state.step !== 4 && !confirmation.uncertain && (
            <p role="alert" className="text-xs text-warning">Some selected files are unavailable. Reselect or remove photos in Step 1 and documents in Step 4 before creating the asset.</p>
          )}

          {!confirmation.uncertain && <RegistrationReferenceState draft={state.draft} options={options} onRetry={references.retry} />}
          {state.step === 4 ? (
            <RegistrationReviewStep draft={state.draft} options={options} onEdit={edit} locked={locked} photoCount={photoSelection.photos.length} needsPhotoReselection={needsPhotoReselection} documentGroups={documents.groups} verifiedFiles={verifiedFiles} />
          ) : (
            <Step {...stepProps} />
          )}
          {state.step === 4 && (
            <RegistrationConfirmation confirmation={confirmation} blocker={creationBlocker} missingFiles={missingFiles} serialNumber={state.draft.serialNumber} onOverride={(reason) => { void submit(reason); }} onLeave={() => router.push("/asset-workspace/assets")}
              onRetry={() => { void submit(); }} onEdit={edit} />
          )}
        </RegistrationWorkspace>
        <RegistrationNavigation
          step={state.step} editing={state.editing} locked={locked} busy={confirmation.busy} uncertain={confirmation.uncertain}
          canConfirm={!confirmation.storageBlocked && (confirmation.uncertain || !fileCache.restoring && !creationBlocker && !missingFiles)}
          onCancel={() => registration.dirty ? registration.setCancelOpen(true) : void discard()}
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
