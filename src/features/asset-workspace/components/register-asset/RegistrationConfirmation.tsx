import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { ArrowRightIcon, BoxIcon, CheckIcon, TagIcon } from "@/components/ui/icons";
import { registrationCategoryPath } from "../../domain/registration-categories";
import type { RegistrationDraft } from "../../domain/registration-draft";
import { registrationInitialStatus } from "../../domain/registration-initial-state";
import { registrationCustodyLabel } from "../../domain/registration-reference-choices";
import { locationPath } from "../../domain/registration-validation";
import type { RegistrationPhoto } from "../../hooks/use-registration-photos";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { ConditionBadge, StatusBadge } from "../StatusBadges";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import type { useRegistrationConfirmation } from "../../hooks/use-registration-confirmation";
import { selectedFileIds, validReceipt } from "../../domain/registration-confirmation";
import type { OutcomeAction } from "../../domain/registration-outcome";
import { RegistrationProgressDialog } from "./RegistrationProgressDialog";
import type { CreatedRegistration } from "../../services/asset-registration-write-contract";

type Confirmation = ReturnType<typeof useRegistrationConfirmation>;
// Core PR A returns this app's Profile route; an older Core's path matches no page, so build it from the id.
const profileHref = ({ assetId, profilePath }: CreatedRegistration) =>
  profilePath?.startsWith("/asset-workspace/assets/") ? profilePath : `/asset-workspace/assets/${encodeURIComponent(assetId)}`;
// Where "Review and edit" takes the user for a rejected create; anything else stays on the review.
const EDIT_STEP: Record<string, number> = { SERIAL_DUPLICATE: 1, UPLOAD_EXPIRED: 0, NOT_FOUND: 0 };

export function RegistrationConfirmation({ confirmation, blocker, missingFiles, serialNumber, onOverride, onLeave, onRetry, onEdit }: {
  confirmation: Confirmation; blocker: string; missingFiles: boolean; serialNumber: string; onOverride: (reason: string) => void; onLeave: () => void;
  onRetry: () => void; onEdit: (step: number) => void;
}) {
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const { record, options, busy, uncertain, storageBlocked, message, error, stage, failure } = confirmation;
  const selected = record ? selectedFileIds(record.draft) : [];
  const uploads = record?.uploads.filter((upload) => selected.includes(upload.localId)) ?? [];
  const progressFiles = uploads.map((upload) => ({
    id: upload.uploadId, name: upload.filename, done: validReceipt(upload), active: !validReceipt(upload) && message.endsWith(upload.filename),
  }));
  const openOverride = () => { setOverrideOpen(true); setReason(""); setConfirmed(false); };
  const act = (action: OutcomeAction) => {
    if (action === "retry") { onRetry(); return; }
    const editStep = action === "edit" && failure?.code ? EDIT_STEP[failure.code] : undefined;
    confirmation.dismissFailure(editStep !== undefined);
    if (action === "override") openOverride();
    else if (editStep !== undefined) onEdit(editStep);
  };
  return (
    <section className="@container/confirmation mb-3 min-w-0 space-y-3 rounded-card border border-border bg-card p-4" aria-label="Confirmation status">
      <RegistrationProgressDialog
        open={busy || Boolean(failure)} busy={busy} stage={stage}
        files={progressFiles} waiting={Math.max(selected.length - progressFiles.length, 0)}
        failure={failure} canOverride={Boolean(options?.serialOverride)} onAction={act}
      />
      <h2 className="text-sm font-semibold text-foreground">Confirm registration</h2>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Files are uploaded and verified before the asset is created. Keep this tab open until the result is confirmed.
      </p>
      {busy && (
        <p role="status" aria-live="polite" className="rounded-control bg-info-muted p-3 text-xs leading-relaxed text-accent-foreground">
          {message || "Please wait…"}
        </p>
      )}
      {uploads.length ? (
        <ul className="space-y-2 text-xs leading-relaxed" aria-label="File progress">
          {uploads.map((upload) => (
            <li key={upload.uploadId} className="flex min-w-0 flex-col gap-1 rounded-control bg-muted p-3 @min-md/confirmation:flex-row @min-md/confirmation:justify-between">
              <span className="min-w-0 flex-1 break-words text-foreground">{upload.filename}</span>
              <span className="text-muted-foreground @min-md/confirmation:shrink-0">
                {validReceipt(upload) ? "Verified" : upload.unusable || upload.completed ? "Expired / unavailable" : "Pending verification"}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {error && (
        <p role="alert" className="rounded-control bg-error-muted p-3 text-xs leading-relaxed text-foreground">
          {error}
        </p>
      )}
      {missingFiles && !uncertain && (
        <p role="alert" className="rounded-control bg-warning-muted p-3 text-xs leading-relaxed text-foreground">
          Some selected files are unavailable. Edit Step 1 or Step 4 to reselect them or remove their selection.
        </p>
      )}
      {storageBlocked && (
        <div className="space-y-3 rounded-control bg-warning-muted p-3 text-xs leading-relaxed text-foreground">
          <p role="alert">
            Recovery storage is unavailable or contains an unreadable record. Confirmation is blocked to protect this registration.
          </p>
          <Button variant="outline" size="sm" className="max-sm:h-10" disabled={busy} onClick={confirmation.retryStorage}>
            Retry recovery storage
          </Button>
        </div>
      )}
      {blocker && !uncertain && (
        <p role="status" className="rounded-control bg-muted p-3 text-xs leading-relaxed text-foreground">
          {blocker}
        </p>
      )}
      {uncertain && (
        <p role="alert" className="rounded-control bg-warning-muted p-3 text-xs leading-relaxed text-foreground">
          The creation result is unknown. Retry the original request to recover its result; editing remains locked.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="max-sm:h-10" disabled={busy} onClick={confirmation.refresh}>
          Refresh availability
        </Button>
        {uncertain && (
          <Button variant="outline" size="sm" className="max-sm:h-10" disabled={busy} onClick={onLeave}>
            Leave and keep recovery
          </Button>
        )}
        {!uncertain && !busy && !storageBlocked && record?.rejectedSerial && record.rejectedSerial === serialNumber.trim() && options?.serialOverride && (
          <Button variant="outline" size="sm" className="max-sm:h-10" onClick={openOverride}>
            Review serial override
          </Button>
        )}
      </div>
      <AlertDialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] rounded-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Override duplicate Serial Number?</AlertDialogTitle>
            <AlertDialogDescription>This Serial Number is already used. Only continue when this registration is intentional. Your reason will be recorded.</AlertDialogDescription>
          </AlertDialogHeader>
          <label className="space-y-2 text-xs">
            <span>Reason (required, up to 1000 characters)</span>
            <Input value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)} />
          </label>
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            I confirm this duplicate Serial Number is intentional.
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <Button disabled={!confirmed || !reason.trim() || busy || Boolean(blocker)} onClick={() => { setOverrideOpen(false); onOverride(reason.trim()); }}>Confirm override and create</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

/** Success (PO scan-flow "Asset Found" pattern): the new asset's identity card with its tag, then the next moves. */
export function RegistrationReceipt({ result, draft, options, photo, onBack, onAnother, children }: {
  result: CreatedRegistration; draft: RegistrationDraft; options?: RegistrationOptions | null; photo?: RegistrationPhoto;
  onBack: () => void; onAnother: () => boolean | Promise<boolean>; children?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const rows = [
    { label: "Category", value: registrationCategoryPath(draft.categoryId, draft.selectedReferences.categories) || "—" },
    { label: "Location", value: locationPath(draft.locationId, draft) || "—" },
    { label: "Custodian", value: registrationCustodyLabel(draft) },
    { label: "Serial Number", value: draft.serialNumber.trim() || "—" },
  ];
  return (
    <section className="h-full min-h-0 overflow-y-auto overscroll-contain py-2" aria-label="Registration succeeded">
      <div className="mx-auto w-full max-w-xl space-y-5 rounded-card border border-border bg-card p-6 shadow-panel">
        <header className="flex flex-col items-center gap-3 text-center">
          <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-success-muted text-success">
            <CheckIcon className="size-7" />
          </span>
          <div className="space-y-1">
            <h2 className="text-kpi font-bold text-foreground">Asset registered</h2>
            <p className="text-sm text-muted-foreground">
              {result.replayed ? "The original registration result was recovered." : "It's now in your organization's asset register."}
            </p>
          </div>
        </header>

        <div className="flex flex-col gap-4 rounded-control border border-border p-4 sm:flex-row">
          <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-control bg-muted">
            {photo ? (
              <Image src={photo.previewUrl} alt={`Photo of ${draft.name.trim() || "the new asset"}`} fill unoptimized sizes="96px" className="object-cover" />
            ) : (
              <BoxIcon aria-hidden="true" className="size-10 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2">
                {/* Recovery may have no options; then custody alone decides (Available without, Assigned with). */}
                <StatusBadge status={options ? registrationInitialStatus(draft, options) : draft.custodyType === "none" ? "Available" : "Assigned"} />
                <ConditionBadge condition={draft.condition} />
              </div>
              <p className="text-base font-semibold wrap-anywhere text-foreground">{draft.name.trim() || "New asset"}</p>
              <p className="inline-flex items-center gap-1.5 text-sm font-medium tabular-nums text-foreground">
                <TagIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="sr-only">Asset Tag</span>
                {result.assetTag}
              </p>
            </div>
            <dl className="grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-[auto_minmax(0,1fr)]">
              {rows.map((row) => (
                <div key={row.label} className="contents">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="mb-1 wrap-anywhere text-foreground sm:mb-0">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {children}
        {failed && <p role="alert" className="text-xs text-error">Could not clear the previous registration from tab storage. The successful result is kept. Try again.</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" disabled={busy} onClick={onBack}>Back to Assets</Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" disabled={busy} onClick={() => {
              setBusy(true);
              void Promise.resolve(onAnother()).then((reset) => setFailed(!reset)).finally(() => setBusy(false));
            }}>{busy ? "Please wait…" : "Register another"}</Button>
            <Button asChild>
              <Link href={profileHref(result)}>
                View Asset Profile
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
