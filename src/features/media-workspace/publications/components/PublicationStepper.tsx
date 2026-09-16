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
                ? "bg-indigo-600 text-white"
                : state === "complete"
                  ? "bg-emerald-100 text-emerald-700"
                  : state === "reachable"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-zinc-100 text-zinc-400"
            }`}
          >
            {state === "complete" ? <CheckIcon className="h-3.5 w-3.5" /> : item.step}
          </div>
        );
        const label = (
          <span
            className={`whitespace-nowrap text-xs font-medium ${
              state === "active" ? "text-zinc-900" : "text-zinc-400"
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
                className="flex flex-col items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
              <div className="mx-3 mb-5 h-px flex-1 bg-zinc-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}
