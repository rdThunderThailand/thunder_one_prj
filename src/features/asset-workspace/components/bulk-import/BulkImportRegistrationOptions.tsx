"use client";

import { useId, type Ref } from "react";
import { Textarea } from "@/components/ui/lovable/textarea";
import { formatCount } from "../../domain/asset-import-format";
import type { ConfirmMode, ImportBatch } from "../../domain/asset-import-types";

export function BulkImportRegistrationOptions({
  counts,
  mode,
  reason,
  onMode,
  onReason,
  maxLength,
  disabled,
  reasonId,
  reasonError,
  onBlur,
  reasonRef,
}: {
  counts: ImportBatch["counts"];
  mode: ConfirmMode;
  reason: string;
  onMode: (mode: ConfirmMode) => void;
  onReason: (reason: string) => void;
  maxLength: number;
  disabled: boolean;
  reasonId: string;
  reasonError: boolean;
  onBlur?: () => void;
  reasonRef?: Ref<HTMLTextAreaElement>;
}) {
  const group = useId();
  return (
    <section className="min-w-0 space-y-3 rounded-card border border-border bg-card p-4 @min-5xl/review:order-last @min-5xl/review:self-start">
      <h2 className="text-sm font-semibold">Registration Options</h2>
      {counts.warning > 0 ? (
        <>
          <fieldset disabled={disabled} className="space-y-3">
            <legend className="mb-3 text-xs font-semibold">
              What to register
            </legend>
            {(["ready_and_warnings", "ready_only"] as const).map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-2 rounded-control border border-border p-3 text-xs has-checked:border-primary has-checked:bg-info-muted/40"
              >
                <input
                  type="radio"
                  name={group}
                  value={value}
                  checked={mode === value}
                  onChange={() => onMode(value)}
                  className="mt-0.5 size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-ring"
                />
                <span className="min-w-0 space-y-1">
                  <span className="block font-semibold">
                    {value === "ready_and_warnings"
                      ? "Register ready rows and rows with warnings"
                      : "Register ready rows only"}
                  </span>
                  <span className="block text-2xs text-muted-foreground">
                    {value === "ready_and_warnings"
                      ? `Creates ${formatCount(counts.valid)} ready rows and ${formatCount(counts.warning)} rows with warnings. ${formatCount(counts.error)} error rows are skipped.`
                      : `Creates ${formatCount(counts.valid)} ready rows. Warning rows are not registered.`}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          {mode === "ready_and_warnings" && (
            <div className="space-y-2">
              <label htmlFor={reasonId} className="text-xs font-semibold">
                <span>Reason for registering rows with warnings </span>
                <span className="text-error">*</span>
              </label>
              <Textarea
                id={reasonId}
                required
                ref={reasonRef}
                value={reason}
                disabled={disabled}
                rows={3}
                maxLength={maxLength}
                onChange={(event) => onReason(event.target.value)}
                onBlur={onBlur}
                aria-invalid={reasonError}
                aria-describedby={`${reasonId}-hint${
                  reasonError ? ` ${reasonId}-error` : ""
                }`}
                className="text-xs"
              />
              <p className="text-right text-2xs tabular-nums text-muted-foreground">
                {reason.length}/{maxLength}
              </p>
              <p
                id={`${reasonId}-hint`}
                className="text-2xs text-muted-foreground"
              >
                Saved on each warning row and in each asset&apos;s history.
              </p>
              {reasonError && (
                <p
                  id={`${reasonId}-error`}
                  role="alert"
                  className="text-xs text-error"
                >
                  Enter a reason to register rows with warnings.
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          All {formatCount(counts.valid)} ready rows will be registered.
        </p>
      )}
    </section>
  );
}
