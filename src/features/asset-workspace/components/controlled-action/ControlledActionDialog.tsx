"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AlertCircleIcon,
  DisposeIcon,
  LocationIcon,
  RetireIcon,
  ReturnIcon,
  ToolIcon,
  TransferIcon,
  UserIcon,
  type Icon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { ActionFields } from "./ActionFields";
import {
  ACTION_LABELS,
  initialDraft,
  toSubmission,
  validateDraft,
  type ActionAsset,
  type ActionSubmission,
  type ControlledActionKey,
} from "./controlled-action";

const ACTION_ICONS: Record<ControlledActionKey, Icon> = {
  assign: UserIcon,
  return: ReturnIcon,
  transfer: TransferIcon,
  move_location: LocationIcon,
  change_status_condition: ToolIcon,
  retire: RetireIcon,
  dispose: DisposeIcon,
};

const STEPS = ["Details", "Review"] as const;
type Step = (typeof STEPS)[number];

interface ControlledActionDialogProps {
  /** The action to run; null keeps the dialog closed. */
  action: ControlledActionKey | null;
  asset: ActionAsset;
  onClose: () => void;
  /** Rejecting keeps the dialog on Review with the input intact. */
  onConfirm: (submission: ActionSubmission) => Promise<void>;
}

/** Details → Review → Confirm for one controlled lifecycle action (P1-08). */
export function ControlledActionDialog({ action, asset, onClose, onConfirm }: ControlledActionDialogProps) {
  return (
    <Dialog
      open={action !== null}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      {action && (
        <ActionFlow
          action={action}
          asset={asset}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      )}
    </Dialog>
  );
}

function ActionFlow({ action, asset, onClose, onConfirm }: ControlledActionDialogProps & { action: ControlledActionKey }) {
  const [step, setStep] = useState<Step>("Details");
  const [draft, setDraft] = useState(() => initialDraft(asset));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstStep = useRef(true);

  const errors = validateDraft(action, asset, draft);
  const isValid = errors.length === 0;
  const submission = toSubmission(action, asset, draft);
  const ActionIcon = ACTION_ICONS[action];

  // Radix focuses the first field on open; after that, each step change moves focus to its heading.
  useEffect(() => {
    if (isFirstStep.current) {
      isFirstStep.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValid || isSubmitting) return;
    if (step === "Details") {
      setStep("Review");
      return;
    }
    setIsSubmitting(true);
    setHasFailed(false);
    onConfirm(submission)
      .then(onClose)
      .catch(() => setHasFailed(true))
      .finally(() => setIsSubmitting(false));
  }

  return (
    <DialogContent
      onEscapeKeyDown={(event) => isSubmitting && event.preventDefault()}
      onInteractOutside={(event) => isSubmitting && event.preventDefault()}
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        noValidate
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ActionIcon className="h-5 w-5 text-muted-foreground" />
            {ACTION_LABELS[action]}
          </DialogTitle>
          <DialogDescription>
            {asset.label} · {asset.status} · {asset.condition}
          </DialogDescription>
        </DialogHeader>

        <ol
          className="flex gap-4 text-xs font-semibold"
          aria-label="Steps"
        >
          {STEPS.map((name, index) => (
            <li
              key={name}
              aria-current={name === step ? "step" : undefined}
              className={name === step ? "text-primary" : "text-muted-foreground"}
            >
              {index + 1}. {name}
            </li>
          ))}
        </ol>

        <h3
          ref={headingRef}
          tabIndex={-1}
          className="sr-only"
        >
          {step}
        </h3>

        {step === "Details" ? (
          <ActionFields
            action={action}
            asset={asset}
            draft={draft}
            onChange={setDraft}
          />
        ) : (
          <ReviewSummary
            asset={asset}
            submission={submission}
          />
        )}

        {step === "Details" && !isValid && (
          <p
            className="text-sm text-muted-foreground"
            aria-live="polite"
          >
            {errors[0]}
          </p>
        )}
        {hasFailed && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-lg bg-error-muted px-3 py-2 text-sm text-error"
          >
            <AlertCircleIcon />
            The action could not be completed. Check the details and try again.
          </p>
        )}

        <DialogFooter className="gap-2">
          {step === "Details" ? (
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setStep("Details")}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
          >
            {step === "Details" ? "Next" : isSubmitting ? "Confirming…" : "Confirm"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function ReviewSummary({ asset, submission }: { asset: ActionAsset; submission: ActionSubmission }) {
  const rows: [string, string][] = [["Status", submission.to === asset.status ? asset.status : `${asset.status} → ${submission.to}`]];
  if (submission.condition !== asset.condition) rows.push(["Condition", `${asset.condition} → ${submission.condition}`]);
  if (submission.custody) rows.push(["Custodian", `${asset.custody ? `${asset.custody.label} → ` : ""}${submission.custody.label}`]);
  if (submission.location) rows.push(["Location", `${asset.location ? `${asset.location} → ` : ""}${submission.location}`]);
  rows.push(["Reason", submission.reason ?? "—"]);

  return (
    <dl className="divide-y divide-border rounded-lg border border-border text-sm">
      {rows.map(([term, value]) => (
        <div
          key={term}
          className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 px-3 py-2"
        >
          <dt className="text-muted-foreground">
            {term}
          </dt>
          <dd className="break-words text-foreground">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
