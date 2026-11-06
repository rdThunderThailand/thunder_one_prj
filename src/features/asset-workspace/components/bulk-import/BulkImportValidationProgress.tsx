import { CheckIcon, SpinnerIcon } from "@/components/ui/icons";
import { Progress } from "@/components/ui/lovable/progress";
import { cn } from "@/lib/utils";
import { formatCount } from "../../domain/asset-import-format";
import type { ImportProgress } from "../../services/asset-import-start";

const phases = [
  { key: "sending", label: "Send rows", title: "Sending your rows" },
  { key: "validating", label: "Check data", title: "Checking your asset data" },
  { key: "refreshing", label: "Load results", title: "Getting your results ready" },
] as const;

export function BulkImportValidationProgress({ progress }: { progress: ImportProgress }) {
  const validation = progress.validation;
  const phase = validation?.phase ?? "sending";
  const currentIndex = phases.findIndex((item) => item.key === phase);
  const sending = phase === "sending";
  const percentage = Math.min(100, Math.max(0, Math.floor(progress.value)));

  return (
    <div className="flex flex-1 flex-col justify-center gap-6 py-6 sm:px-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-control bg-muted">
          <SpinnerIcon aria-hidden="true" className="size-5 animate-spin text-primary motion-reduce:animate-none" />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-semibold">{phases[currentIndex].title}</h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {sending
              ? "Your rows are being sent to the asset service for validation."
              : phase === "validating"
                ? "ThunderOne is checking required fields, references, and duplicates."
                : "The data check has returned. Loading the latest summary."}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs tabular-nums">
          <span className="font-medium">
            {sending && validation
              ? `${formatCount(validation.sentRows)} of ${formatCount(validation.totalRows)} rows sent`
              : sending ? "Sending rows" : "Waiting for the asset service"}
          </span>
          <span className="text-muted-foreground">{sending ? `${percentage}% sent` : "In progress"}</span>
        </div>
        <Progress
          value={sending ? progress.value : 100}
          aria-label={sending ? "Rows sent to the asset service" : phases[currentIndex].title}
          aria-valuenow={sending ? percentage : undefined}
          aria-valuetext={progress.label}
          className="h-3 bg-muted"
          indicatorClassName={cn(
            "transition-transform duration-500 ease-out motion-reduce:transition-none",
            !sending && "progress-stripes",
          )}
        />
        <p role="status" className="text-xs leading-relaxed text-muted-foreground">
          {progress.label}
        </p>
      </div>
      <ol aria-label="Validation stages" className="grid grid-cols-3 gap-3 border-t border-border pt-4">
        {phases.map((item, index) => (
          <li
            key={item.key}
            aria-current={index === currentIndex ? "step" : undefined}
            className="flex min-w-0 flex-col items-start gap-2 text-xs sm:flex-row sm:items-center"
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
                index === currentIndex && "bg-primary text-primary-foreground",
              )}
            >
              {index < currentIndex ? (
                <CheckIcon className="size-3" />
              ) : (
                index + 1
              )}
            </span>
            <span className={cn("text-muted-foreground", index === currentIndex && "font-semibold text-foreground")}>
              {index < currentIndex && <span className="sr-only">Completed: </span>}
              {item.label}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Keep this page open. Assets are created only after you review and confirm.
      </p>
    </div>
  );
}
