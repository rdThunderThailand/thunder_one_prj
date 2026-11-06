import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface WizardStepsProps {
  steps: string[];
  /** 0-based index of the step currently showing. */
  currentIndex: number;
  descriptions?: string[];
  variant?: "default" | "detailed";
}

// A numbered step indicator for multi-step forms/modals — used by
// people/personnel's AddPersonModal and people/new-hires's AddEmployeeModal.
export function WizardSteps({ steps, currentIndex, descriptions, variant = "default" }: WizardStepsProps) {
  if (variant === "detailed") {
    return (
      <ol aria-label="Registration steps" className="flex items-start gap-3 p-1">
        {steps.map((label, index) => {
          const current = index === currentIndex;
          const done = index < currentIndex;
          return (
            <li
              key={label}
              aria-current={current ? "step" : undefined}
              className={cn("min-w-0", index < steps.length - 1 ? "flex-1" : "w-8 sm:w-36")}
            >
              <div className="flex h-8 items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-muted-foreground",
                    done && "border-primary bg-card text-primary",
                    current && "border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background",
                  )}
                >
                  {done ? <CheckIcon aria-hidden="true" className="size-4" /> : index + 1}
                </span>
                {index < steps.length - 1 && (
                  <span aria-hidden="true" className={cn("h-px min-w-0 flex-1 bg-border", done && "bg-primary")} />
                )}
              </div>
              <span className={cn("mt-2 hidden text-xs font-semibold text-foreground sm:block lg:text-sm", current && "text-accent-foreground")}>
                {label}
              </span>
              {descriptions?.[index] && (
                <span className="mt-1 hidden text-xs leading-relaxed text-muted-foreground sm:block">
                  {descriptions[index]}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className="flex items-center">
      {steps.map((label, index) => {
        const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming";
        return (
          <li key={label} className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}>
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  state === "done"
                    ? "bg-primary text-primary-foreground"
                    : state === "current"
                      ? "border-2 border-primary text-primary"
                      : "border border-border text-t1-gray-400"
                }`}
              >
                {state === "done" ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={`hidden max-w-[80px] text-center text-[11px] leading-tight sm:block ${
                  state === "upcoming" ? "text-t1-gray-400" : "text-foreground"
                }`}
              >
                {label}
              </span>
              {descriptions?.[index] && (
                <span className="hidden max-w-40 text-center text-2xs text-muted-foreground sm:block">
                  {descriptions[index]}
                </span>
              )}
            </div>
            {index < steps.length - 1 && (
              <span className={`mx-1.5 h-px flex-1 ${state === "done" ? "bg-primary" : "bg-border"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
