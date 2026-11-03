"use client";

import Link from "next/link";
import {
  AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { Button } from "@/components/ui/lovable/button";
import { Progress } from "@/components/ui/lovable/progress";
import {
  CheckCircleIcon, CircleIcon, InfoIcon, SpinnerIcon, UploadIcon, WarningTriangleIcon, XCircleIcon, type Icon,
} from "@/components/ui/icons";
import {
  registrationOutcome, registrationProgress, type OutcomeAction, type RegistrationFailure, type RegistrationStage,
} from "../../domain/registration-outcome";

export interface ProgressFile { id: string; name: string; done: boolean; active: boolean }

const STEP_ORDER: RegistrationStage[] = ["checking", "uploading", "creating"];
const toneClasses = {
  primary: "bg-info-muted text-primary",
  warning: "bg-warning-muted text-t1-amber-700",
  error: "bg-error-muted text-t1-red-700",
  info: "bg-info-muted text-info",
} as const;
const outcomeIcon: Record<"warning" | "error" | "info", Icon> = { warning: WarningTriangleIcon, error: XCircleIcon, info: InfoIcon };
const actionLabel: Record<OutcomeAction, string> = {
  retry: "Retry", override: "Review serial override", edit: "Review and edit", close: "Close",
};

function StepMark({ state }: { state: "done" | "active" | "pending" }) {
  if (state === "done") return <CheckCircleIcon aria-label="Done" className="size-5 shrink-0 text-success" />;
  if (state === "active") return <SpinnerIcon aria-label="In progress" className="size-5 shrink-0 animate-spin text-primary" />;
  return <CircleIcon aria-label="Waiting" className="size-5 shrink-0 text-t1-gray-300" />;
}

function stepState(step: RegistrationStage, stage: RegistrationStage | null): "done" | "active" | "pending" {
  const current = stage === "recovering" ? "creating" : stage;
  if (!current) return "pending";
  const at = STEP_ORDER.indexOf(current);
  const index = STEP_ORDER.indexOf(step);
  return index < at ? "done" : index === at ? "active" : "pending";
}

/** Step 5's create, from checks to the result (PO scan-flow pattern: one dialog for progress and outcome).
 *  It stays open while the run is active: closing it cannot stop a create that may already be committing. */
export function RegistrationProgressDialog({ open, busy, stage, files, waiting, failure, canOverride, onAction }: {
  open: boolean; busy: boolean; stage: RegistrationStage | null;
  files: ProgressFile[]; waiting: number;
  failure: RegistrationFailure | null; canOverride: boolean;
  onAction: (action: OutcomeAction) => void;
}) {
  const outcome = !busy && failure ? registrationOutcome(failure, canOverride) : null;
  const total = files.length + waiting;
  const done = files.filter((file) => file.done).length;
  const recovering = stage === "recovering";
  const OutcomeIcon = outcome ? outcomeIcon[outcome.tone] : UploadIcon;
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!next && !busy) onAction("close"); }}>
      <AlertDialogContent
        className="max-w-md gap-5 rounded-card"
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}
        aria-busy={busy}
      >
        <AlertDialogHeader className="items-center text-center sm:text-center">
          <span aria-hidden="true" className={`flex size-14 items-center justify-center rounded-full ${toneClasses[outcome?.tone ?? "primary"]}`}>
            <OutcomeIcon className="size-7" />
          </span>
          <AlertDialogTitle className="text-base">
            {outcome ? outcome.title : recovering ? "Recovering the result…" : "Creating asset…"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs">
            {outcome ? outcome.body : "Keep this tab open until it's done. Your registration is saved in this tab."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {busy && (
          <div className="space-y-4">
            <Progress value={registrationProgress(stage, done, total)} aria-label="Creation progress" className="h-1.5 bg-muted" />
            <ol className="space-y-3 text-sm" aria-live="polite">
              {recovering ? (
                <li className="flex items-center gap-3"><StepMark state="active" />Checking whether the asset was created</li>
              ) : (
                <>
                  <li className="flex items-center gap-3"><StepMark state={stepState("checking", stage)} />Checking registration rules</li>
                  {total > 0 && (
                    <li className="space-y-2">
                      <span className="flex items-center gap-3">
                        <StepMark state={stepState("uploading", stage)} />
                        Uploading files
                        <span className="text-xs tabular-nums text-muted-foreground">{done} of {total}</span>
                      </span>
                      {stage === "uploading" && files.length > 0 && (
                        <ul className="ml-8 space-y-1 text-xs">
                          {files.map((file) => (
                            <li key={file.id} className="flex min-w-0 items-center gap-2">
                              <StepMark state={file.done ? "done" : file.active ? "active" : "pending"} />
                              <span className="min-w-0 truncate text-muted-foreground">{file.name}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )}
                  <li className="flex items-center gap-3"><StepMark state={stepState("creating", stage)} />Creating the asset</li>
                </>
              )}
            </ol>
          </div>
        )}

        {outcome?.duplicates && outcome.duplicates.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">Already used by</p>
            <ul className="divide-y divide-border-subtle rounded-control border border-border text-sm">
              {outcome.duplicates.slice(0, 5).map((asset) => (
                <li key={asset.id} className="flex min-w-0 items-center justify-between gap-3 px-3 py-2">
                  <Link
                    href={`/asset-workspace/assets/${encodeURIComponent(asset.id)}`} target="_blank" rel="noopener noreferrer"
                    className="min-w-0 truncate font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {asset.name || "Unnamed asset"}
                  </Link>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{asset.assetTag ?? "No tag"}</span>
                </li>
              ))}
            </ul>
            {outcome.duplicates.length > 5 && <p className="text-xs text-muted-foreground">and {outcome.duplicates.length - 5} more</p>}
          </div>
        )}

        {outcome && (
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            {outcome.secondary && <Button variant="outline" onClick={() => onAction(outcome.secondary!)}>{actionLabel[outcome.secondary]}</Button>}
            <Button autoFocus onClick={() => onAction(outcome.primary)}>{actionLabel[outcome.primary]}</Button>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
