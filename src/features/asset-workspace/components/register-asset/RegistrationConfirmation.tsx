import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/lovable/button";
import { Input } from "@/components/ui/lovable/input";
import { CheckIcon } from "@/components/ui/icons";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import type { useRegistrationConfirmation } from "../../hooks/use-registration-confirmation";
import { selectedFileIds, validReceipt } from "../../domain/registration-confirmation";
import type { CreatedRegistration } from "../../services/asset-registration-write-contract";

type Confirmation = ReturnType<typeof useRegistrationConfirmation>;
export function RegistrationConfirmation({ confirmation, blocker, missingFiles, serialNumber, onOverride, onLeave }: {
  confirmation: Confirmation; blocker: string; missingFiles: boolean; serialNumber: string; onOverride: (reason: string) => void; onLeave: () => void;
}) {
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const { record, options, busy, uncertain, storageBlocked, message, error } = confirmation;
  const uploads = record?.uploads.filter((upload) => selectedFileIds(record.draft).includes(upload.localId)) ?? [];
  return (
    <section className="mb-3 space-y-3 rounded-card border border-border bg-card p-4" aria-label="Confirmation status">
      <h2 className="text-sm font-semibold">Confirm registration</h2>
      <p className="text-xs text-muted-foreground">Files are uploaded and verified before the asset is created. Keep this tab open until the result is confirmed.</p>
      {busy && <p role="status" aria-live="polite" className="text-xs text-primary">{message || "Please wait…"}</p>}
      {uploads.length ? (
        <ul className="space-y-2 text-xs" aria-label="File progress">
          {uploads.map((upload) => (
            <li key={upload.uploadId} className="flex items-start justify-between gap-3">
              <span className="min-w-0 break-words">{upload.filename}</span>
              <span className="shrink-0 text-muted-foreground">{validReceipt(upload) ? "Verified" : upload.unusable || upload.completed ? "Expired / unavailable" : "Pending verification"}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {error && <p role="alert" className="text-xs text-error">{error}</p>}
      {missingFiles && !uncertain && <p role="alert" className="text-xs text-warning">Some selected files are unavailable. Edit Step 1 or Step 4 to reselect them or remove their selection.</p>}
      {storageBlocked && (
        <div className="space-y-2">
          <p role="alert" className="text-xs text-warning">Recovery storage is unavailable or contains an unreadable record. Confirmation is blocked to protect this registration.</p>
          <Button variant="outline" size="sm" disabled={busy} onClick={confirmation.retryStorage}>Retry recovery storage</Button>
        </div>
      )}
      {blocker && !uncertain && <p role="status" className="text-xs text-muted-foreground">{blocker}</p>}
      {uncertain && <p role="alert" className="text-xs text-warning">The creation result is unknown. Retry the original request to recover its result; editing remains locked.</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={busy} onClick={confirmation.refresh}>Refresh availability</Button>
        {uncertain && <Button variant="outline" size="sm" disabled={busy} onClick={onLeave}>Leave and keep recovery</Button>}
        {!uncertain && !busy && !storageBlocked && record?.rejectedSerial && record.rejectedSerial === serialNumber.trim() && options?.canOverrideSerial && (
          <Button variant="outline" size="sm" onClick={() => { setOverrideOpen(true); setReason(""); setConfirmed(false); }}>Review serial override</Button>
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

export function RegistrationReceipt({ result, onBack, onAnother, children }: { result: CreatedRegistration; onBack: () => void; onAnother: () => boolean | Promise<boolean>; children?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-xl flex-col items-center gap-4 overflow-y-auto overscroll-contain rounded-card border border-border bg-card p-6 text-center [&>*]:shrink-0" aria-label="Registration succeeded">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-muted text-success">
        <CheckIcon className="h-6 w-6" />
      </span>
      <h2 className="text-lg font-semibold">Asset registered</h2>
      <p className="text-sm">Asset Tag: <strong className="break-all">{result.assetTag}</strong></p>
      <p className="text-xs text-muted-foreground">{result.replayed ? "The original registration result was recovered." : "Your asset was created successfully."}</p>
      <Button variant="outline" disabled aria-describedby="registration-profile-reason">View Asset Profile</Button>
      <p id="registration-profile-reason" className="text-xs text-muted-foreground">The Asset Profile page is not available yet.</p>
      {children}
      {failed && <p role="alert" className="text-xs text-error">Could not clear the previous registration from tab storage. The successful result is kept. Try again.</p>}
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" disabled={busy} onClick={onBack}>Back to Assets</Button>
        <Button disabled={busy} onClick={() => {
          setBusy(true);
          void Promise.resolve(onAnother()).then((reset) => setFailed(!reset)).finally(() => setBusy(false));
        }}>{busy ? "Please wait…" : "Register another"}</Button>
      </div>
    </section>
  );
}
