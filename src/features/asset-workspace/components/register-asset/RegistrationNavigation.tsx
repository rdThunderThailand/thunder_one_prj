import { Button } from "@/components/ui/lovable/button";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, SpinnerIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";

export function RegistrationNavigation({ step, editing, locked, busy, uncertain, canConfirm, onCancel, onBack }: {
  step: number; editing: boolean; locked: boolean; busy: boolean; uncertain: boolean; canConfirm: boolean;
  onCancel: () => void; onBack: () => void;
}) {
  const responsiveControl = "min-w-20 max-sm:h-10";
  return (
    <footer data-registration-footer className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-card py-3">
      <Button variant="outline" size="sm" className={responsiveControl} disabled={locked} onClick={onCancel}>
        Cancel
      </Button>
      <div className={cn("flex items-center gap-2", step === 4 && "min-w-0 flex-wrap justify-end")}>
        <Button variant="outline" size="sm" className={responsiveControl} disabled={locked || step === 0} onClick={onBack}>
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Button>
        {step === 4 ? (
          <Button
            type="submit"
            size="sm"
            className={cn(responsiveControl, "min-w-32")}
            disabled={busy || !canConfirm}
            aria-describedby="registration-create-reason"
          >
            {busy ? (
              <SpinnerIcon aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            ) : !uncertain && (
              <CheckIcon aria-hidden="true" className="size-4" />
            )}
            {busy ? "Please wait…" : uncertain ? "Retry original request" : "Create Asset"}
          </Button>
        ) : (
          <Button type="submit" size="sm" className={cn(responsiveControl, "min-w-24")} disabled={locked}>
            {editing ? "Update" : "Next"}
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
      {step === 4 && (
        <p id="registration-create-reason" className="sr-only">
          {uncertain ? "Retry keeps the original submission identity and payload." : "Files upload only on confirmation. Creation is confirmed only after a successful response."}
        </p>
      )}
    </footer>
  );
}

export function RegistrationCancelDialog({ open, onOpenChange, failed, onDiscard, onLeave }: {
  open: boolean; onOpenChange: (open: boolean) => void; failed: boolean; onDiscard: () => Promise<boolean>; onLeave: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[calc(100%-2rem)] rounded-card">
        <AlertDialogHeader>
          <AlertDialogTitle>{failed ? "Could not clear this draft" : "Discard this registration?"}</AlertDialogTitle>
          <AlertDialogDescription>
            {failed ? "Browser storage could not be cleared. A saved draft may remain in this tab. Try again, keep editing, or leave without clearing it."
              : "Your draft will be removed from this tab. No asset has been created. Temporary uploads are managed by the service."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Keep editing</AlertDialogCancel>
          {failed && <Button variant="outline" disabled={busy} onClick={onLeave}>Leave anyway</Button>}
          <AlertDialogAction disabled={busy} onClick={(event) => {
            event.preventDefault();
            setBusy(true);
            void onDiscard().then((removed) => { if (removed) onOpenChange(false); }).finally(() => setBusy(false));
          }}>{busy ? "Discarding…" : failed ? "Try again" : "Discard draft"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
import { useState } from "react";
