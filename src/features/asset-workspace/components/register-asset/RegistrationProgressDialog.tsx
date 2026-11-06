"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { Button } from "@/components/ui/lovable/button";
import { Progress } from "@/components/ui/lovable/progress";
import {
  CheckIcon,
  InfoIcon,
  SpinnerIcon,
  UploadIcon,
  WarningTriangleIcon,
  XCircleIcon,
  XIcon,
  type Icon,
} from "@/components/ui/icons";
import {
  registrationOutcome,
  registrationProgress,
  type OutcomeAction,
  type RegistrationFailure,
  type RegistrationStage,
} from "../../domain/registration-outcome";

export interface ProgressFile {
  id: string;
  name: string;
  done: boolean;
  active: boolean;
}

type StepVisualState = "done" | "active" | "pending";

const STEP_ORDER: RegistrationStage[] = ["checking", "uploading", "creating"];

const toneClasses = {
  primary: "bg-info-muted text-primary",
  warning: "bg-warning-muted text-t1-amber-700",
  error: "bg-error-muted text-t1-red-700",
  info: "bg-info-muted text-info",
} as const;

const outcomeIcon: Record<"warning" | "error" | "info", Icon> = {
  warning: WarningTriangleIcon,
  error: XCircleIcon,
  info: InfoIcon,
};

const actionLabel: Record<OutcomeAction, string> = {
  retry: "Retry",
  override: "Review serial override",
  edit: "Review and edit",
  close: "Close",
};

// Upload requests report no byte progress, so a file is only waiting, uploading or ready.
const fileStatus: Record<StepVisualState, { label: string; text: string; bar: string; value: number }> = {
  done: { label: "Ready", text: "text-success", bar: "[&>div]:bg-success", value: 100 },
  active: { label: "Uploading…", text: "text-primary", bar: "[&>div]:progress-stripes", value: 100 },
  pending: { label: "Waiting", text: "text-muted-foreground", bar: "", value: 0 },
};

function StepMark({ state }: { state: StepVisualState }) {
  if (state === "done") {
    return (
      <span
        aria-label="Done"
        className="flex size-5 shrink-0 items-center justify-center rounded-pill bg-success text-success-foreground"
      >
        <CheckIcon className="size-3" />
      </span>
    );
  }
  if (state === "active") {
    return (
      <SpinnerIcon
        aria-label="In progress"
        className="size-5 shrink-0 animate-spin text-primary"
      />
    );
  }
  return (
    <span
      aria-label="Waiting"
      className="flex size-5 shrink-0 rounded-pill border border-input bg-card"
    />
  );
}

function StepBadge({ state, activeLabel }: { state: StepVisualState; activeLabel: string }) {
  if (state === "done") {
    return (
      <span className="shrink-0 rounded-pill bg-success-muted px-2 py-1 text-2xs font-semibold text-success">
        Ready
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="shrink-0 rounded-pill bg-info-muted px-2 py-1 text-2xs font-semibold text-primary">
        {activeLabel}
      </span>
    );
  }
  return <span className="shrink-0 text-xs text-muted-foreground">Waiting</span>;
}

function StepRow({ state, activeLabel, children }: { state: StepVisualState; activeLabel: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={`flex items-center gap-3 ${state === "pending" ? "text-muted-foreground" : "font-medium text-foreground"}`}
      >
        <StepMark state={state} />
        {children}
      </span>
      <StepBadge
        state={state}
        activeLabel={activeLabel}
      />
    </div>
  );
}

function FileRow({ file }: { file: ProgressFile }) {
  const state: StepVisualState = file.done ? "done" : file.active ? "active" : "pending";
  const status = fileStatus[state];
  return (
    <li className="space-y-2">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <StepMark state={state} />
          <span className="min-w-0 truncate font-medium text-foreground">{file.name}</span>
        </span>
        <span className={`shrink-0 font-semibold ${status.text}`}>{status.label}</span>
      </div>
      <Progress
        value={status.value}
        aria-label={`${file.name} upload progress`}
        className={`h-1 bg-muted ${status.bar}`}
      />
    </li>
  );
}

function stepState(step: RegistrationStage, stage: RegistrationStage | null): StepVisualState {
  const current = stage === "recovering" ? "creating" : stage;
  if (!current) return "pending";
  const at = STEP_ORDER.indexOf(current);
  const index = STEP_ORDER.indexOf(step);
  return index < at ? "done" : index === at ? "active" : "pending";
}

function stageLabel(stage: RegistrationStage | null, totalFiles: number): string {
  if (stage === "recovering") return "Checking creation status…";
  if (stage === "checking" || stage === null) return "Checking registration rules…";
  if (stage === "uploading") return totalFiles > 0 ? "Uploading and verifying files…" : "Preparing registration…";
  return "Creating the asset…";
}

/** Step 5's create, from checks to the result (PO scan-flow pattern: one dialog for progress and outcome).
 *  It stays open while the run is active: closing it cannot stop a create that may already be committing. */
export function RegistrationProgressDialog({
  open,
  busy,
  stage,
  files,
  waiting,
  failure,
  canOverride,
  onAction,
}: {
  open: boolean;
  busy: boolean;
  stage: RegistrationStage | null;
  files: ProgressFile[];
  waiting: number;
  failure: RegistrationFailure | null;
  canOverride: boolean;
  onAction: (action: OutcomeAction) => void;
}) {
  const outcome = !busy && failure ? registrationOutcome(failure, canOverride) : null;
  const total = files.length + waiting;
  const done = files.filter((file) => file.done).length;
  // Count the file in flight as half done so the bar moves during a long upload.
  const inFlight = stage === "uploading" && files.some((file) => file.active) ? 0.5 : 0;
  const percent = registrationProgress(stage, done + inFlight, total);
  const recovering = stage === "recovering";
  const OutcomeIcon = outcome ? outcomeIcon[outcome.tone] : UploadIcon;
  const uploadingState: StepVisualState =
    total > 0 && done === total && (stage === "uploading" || stage === "creating") ? "done" : stepState("uploading", stage);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onAction("close");
      }}
    >
      <AlertDialogContent
        className="max-w-md gap-6 rounded-card bg-card p-6"
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        aria-busy={busy}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={busy}
          aria-label="Close dialog"
          onClick={() => onAction("close")}
          className="absolute right-4 top-4 size-8 rounded-control text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          <XIcon className="size-4" />
        </Button>

        <AlertDialogHeader className="items-center space-y-3 text-center sm:text-center">
          <span
            aria-hidden="true"
            className={`flex size-16 items-center justify-center rounded-pill animate-ring-in ${toneClasses[outcome?.tone ?? "primary"]}`}
          >
            <OutcomeIcon className={busy ? "size-8 motion-safe:animate-pulse" : "size-8"} />
          </span>
          <div className="space-y-1">
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              {outcome ? outcome.title : recovering ? "Recovering the result…" : "Creating asset…"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {outcome ? outcome.body : "Keep this tab open until it's done. Your registration is saved in this tab."}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        {busy && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-muted-foreground">{stageLabel(stage, total)}</span>
                <span className="font-bold tabular-nums text-primary">{percent}%</span>
              </div>
              <Progress
                value={percent}
                aria-label="Creation progress"
                className="h-2 bg-muted [&>div]:progress-stripes"
              />
            </div>

            <ol
              className="space-y-3 rounded-control border border-border bg-background p-4 text-sm"
              aria-live="polite"
            >
              {recovering ? (
                <li>
                  <StepRow
                    state="active"
                    activeLabel="Checking…"
                  >
                    Checking whether the asset was created
                  </StepRow>
                </li>
              ) : (
                <>
                  <li>
                    <StepRow
                      state={stepState("checking", stage)}
                      activeLabel="Checking…"
                    >
                      Checking registration rules
                    </StepRow>
                  </li>

                  {total > 0 && (
                    <li className="space-y-3">
                      <StepRow
                        state={uploadingState}
                        activeLabel="Uploading…"
                      >
                        <span>Uploading files</span>
                        <span className="text-xs font-normal tabular-nums text-muted-foreground">
                          ({done} of {total})
                        </span>
                      </StepRow>
                      {files.length > 0 && (
                        <ul className="ml-8 space-y-2 rounded-control border border-border bg-card p-3 text-xs">
                          {files.map((file) => (
                            <FileRow
                              key={file.id}
                              file={file}
                            />
                          ))}
                        </ul>
                      )}
                    </li>
                  )}

                  <li>
                    <StepRow
                      state={stepState("creating", stage)}
                      activeLabel="Creating…"
                    >
                      Creating the asset
                    </StepRow>
                  </li>
                </>
              )}
            </ol>
          </div>
        )}

        {outcome?.duplicates && outcome.duplicates.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-foreground">Already used by</p>
            <ul className="divide-y divide-border-subtle rounded-control border border-border text-sm">
              {outcome.duplicates.slice(0, 5).map((asset) => (
                <li
                  key={asset.id}
                  className="flex min-w-0 items-center justify-between gap-3 px-3 py-2"
                >
                  <Link
                    href={`/asset-workspace/assets/${encodeURIComponent(asset.id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 truncate font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {asset.name || "Unnamed asset"}
                  </Link>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{asset.assetTag ?? "No tag"}</span>
                </li>
              ))}
            </ul>
            {outcome.duplicates.length > 5 && (
              <p className="text-xs text-muted-foreground">and {outcome.duplicates.length - 5} more</p>
            )}
          </div>
        )}

        {outcome && (
          <AlertDialogFooter className="gap-2 sm:space-x-0">
            {outcome.secondary && (
              <Button
                variant="outline"
                onClick={() => onAction(outcome.secondary!)}
              >
                {actionLabel[outcome.secondary]}
              </Button>
            )}
            <Button
              autoFocus
              onClick={() => onAction(outcome.primary)}
            >
              {actionLabel[outcome.primary]}
            </Button>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
