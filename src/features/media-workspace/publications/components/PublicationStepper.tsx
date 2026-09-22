import { CheckIcon } from "@/components/ui/icons";
import { wizardSteps } from "../mock-data";
import { getStepState, isStepSelectable } from "../stepper-state";

export function PublicationStepper({
  currentStep,
  furthestStep,
  onStepSelect,
}: {
  currentStep: number;
  furthestStep: number;
  onStepSelect: (step: number) => void;
}) {
  return (
    <div className="flex items-start">
      {wizardSteps.map((item, index) => {
        const state = getStepState({ step: item.step, currentStep, furthestStep });
        const selectable = isStepSelectable(state);
        const circle = (
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
              state === "active"
                ? "bg-primary text-white"
                : state === "complete"
                  ? "bg-success-soft text-success"
                  : state === "reachable"
                    ? "bg-primary-soft text-primary"
                    : "bg-muted text-muted-foreground"
            }`}
          >
            {state === "complete" ? <CheckIcon className="h-3.5 w-3.5" /> : item.step}
          </div>
        );
        const label = (
          <span
            className={`whitespace-nowrap text-xs font-medium ${
              state === "active" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {item.label}
          </span>
        );
        return (
          <div key={item.step} className="flex flex-1 items-center last:flex-none">
            {selectable ? (
              <button
                type="button"
                onClick={() => onStepSelect(item.step)}
                className="flex flex-col items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {circle}
                {label}
              </button>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {circle}
                {label}
              </div>
            )}
            {index < wizardSteps.length - 1 && (
              <div className="mx-3 mb-5 h-px flex-1 bg-muted" />
            )}
          </div>
        );
      })}
    </div>
  );
}
