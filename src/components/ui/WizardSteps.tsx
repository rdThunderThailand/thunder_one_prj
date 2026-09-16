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
                    ? "bg-indigo-600 text-white"
                    : state === "current"
                      ? "border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "border border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
                }`}
              >
                {state === "done" ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={`hidden max-w-[80px] text-center text-[11px] leading-tight sm:block ${
                  state === "upcoming" ? "text-zinc-400" : "text-zinc-700 dark:text-zinc-200"
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <span className={`mx-1.5 h-px flex-1 ${state === "done" ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
