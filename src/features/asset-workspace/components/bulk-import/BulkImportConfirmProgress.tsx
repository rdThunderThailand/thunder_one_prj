"use client";

import { Button } from "@/components/ui/lovable/button";
import { cn } from "@/lib/utils";
import { formatCount } from "../../domain/asset-import-format";
import { importConfirmProcessed } from "../../domain/asset-import-review";
import type { ImportBatch } from "../../domain/asset-import-types";
import { AnimatedCount } from "./AnimatedCount";

function ProgressRing({ percent, tone, working }: {
  percent: number;
  tone: "normal" | "retrying" | "failed";
  working: boolean;
}) {
  const stroke = tone === "failed" ? "stroke-error" : tone === "retrying" ? "stroke-warning" : "stroke-primary";
  return (
    <div
      role="progressbar"
      aria-label="Registration progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="relative size-36 shrink-0"
    >
      <svg viewBox="0 0 120 120" aria-hidden="true" className="size-full -rotate-90">
        <circle cx="60" cy="60" r="50" fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100 - percent}
          className={cn(stroke, "transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none")}
        />
      </svg>
      {/* Shows the request is alive between Core's updates; its position is not progress. */}
      {working && (
        <svg
          viewBox="0 0 120 120"
          aria-hidden="true"
          className="absolute inset-0 size-full animate-spin [animation-duration:2400ms] motion-reduce:hidden"
        >
          <circle
            cx="60"
            cy="60"
            r="58"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="8 92"
            className={cn(stroke, "opacity-50")}
          />
        </svg>
      )}
      <p className="absolute inset-0 flex items-center justify-center text-2xl font-bold tabular-nums">
        <AnimatedCount value={percent} />%
      </p>
    </div>
  );
}

export function BulkImportConfirmProgress({
  batch,
  retrying,
  error,
  onRetry,
}: {
  batch: ImportBatch;
  retrying: boolean;
  error?: string;
  onRetry?: () => void;
}) {
  const processed = importConfirmProcessed(batch);
  const percent = batch.totalRows ? Math.floor((processed / batch.totalRows) * 100) : 0;
  const tally = [
    { label: "Created", value: batch.counts.created, tone: "text-success" },
    { label: "With warnings", value: batch.counts.createdWithWarning, tone: "text-warning" },
    { label: "Not registered", value: batch.counts.notRegistered, tone: "text-error" },
  ];
  return (
    <section
      className="@container/progress mx-auto my-auto w-full max-w-2xl animate-in fade-in-0 zoom-in-95 rounded-card border border-border bg-card p-6 duration-300 motion-reduce:animate-none"
      aria-busy={!onRetry}
    >
      <div className="flex flex-col items-center gap-6 text-center @min-lg/progress:flex-row @min-lg/progress:text-left">
        <ProgressRing
          percent={percent}
          tone={error ? "failed" : retrying ? "retrying" : "normal"}
          working={!error && !onRetry}
        />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold">Registering assets…</h2>
            <p role="status" className="text-xs tabular-nums">
              {formatCount(processed)} of {formatCount(batch.totalRows)} rows processed
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4">
            {tally.map(({ label, value, tone }) => (
              <div key={label} className="min-w-0">
                <dd className={cn("text-lg font-bold tabular-nums", tone)}>
                  <AnimatedCount value={value} />
                </dd>
                <dt className="text-2xs text-muted-foreground">{label}</dt>
              </div>
            ))}
          </dl>
          <p className="text-2xs text-muted-foreground">
            Keep this page open. If the connection drops, registration continues when it comes back.
          </p>
          {retrying && (
            <p role="status" className="text-xs text-warning">
              Connection lost. Retrying…
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-error">
              {error}
            </p>
          )}
          {onRetry && (
            <Button size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
