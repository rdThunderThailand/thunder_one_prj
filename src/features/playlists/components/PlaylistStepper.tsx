import { CheckIcon } from "@/components/ui/icons";

export const WIZARD_STEPS = [
  { step: 1, label: "Basic Info", caption: "Set playlist details" },
  { step: 2, label: "Add Content", caption: "Add and arrange media" },
  { step: 3, label: "Settings", caption: "Playback & display options" },
  { step: 4, label: "Review", caption: "Review and confirm" },
] as const;

export const LAST_STEP = WIZARD_STEPS.length;

export function PlaylistStepper({
  currentStep,
  onStepClick,
}: {
  currentStep: number;
  /** Only completed steps are clickable — jumping forward would skip validation. */
  onStepClick?: (step: number) => void;
}) {
  return (
    <div className="flex items-start">
      {WIZARD_STEPS.map((item, index) => {
        const isComplete = item.step < currentStep;
        const isActive = item.step === currentStep;
        const clickable = isComplete && !!onStepClick;
        return (
          <div key={item.step} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onStepClick(item.step) : undefined}
              className={`flex items-center gap-3 rounded-lg px-2 py-1 text-left ${
                clickable ? "hover:bg-zinc-50 dark:hover:bg-zinc-800" : "cursor-default"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : isComplete
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                }`}
              >
                {isComplete ? <CheckIcon className="h-4 w-4" /> : item.step}
              </span>
              <span className="hidden flex-col sm:flex">
                <span
                  className={`whitespace-nowrap text-sm font-medium ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {item.label}
                </span>
                <span className="whitespace-nowrap text-xs text-zinc-400">{item.caption}</span>
              </span>
            </button>
            {index < WIZARD_STEPS.length - 1 && (
              <div className="mx-3 h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            )}
          </div>
        );
      })}
    </div>
  );
}
