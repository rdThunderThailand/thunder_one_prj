import { CheckIcon } from "@/components/ui/icons";

interface WizardStepsProps {
  steps: string[];
  /** 0-based index of the step currently showing. */
  currentIndex: number;
}

// A numbered step indicator for multi-step forms/modals — used by
// people/personnel's AddPersonModal and people/new-hires's AddEmployeeModal.
export function WizardSteps({ steps, currentIndex }: WizardStepsProps) {
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
