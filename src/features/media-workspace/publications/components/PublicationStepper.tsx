import { wizardSteps } from "../mock-data";

export function PublicationStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-start">
      {wizardSteps.map((item, index) => {
        const isComplete = item.step < currentStep;
        const isActive = item.step === currentStep;
        return (
          <div key={item.step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : isComplete
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {item.step}
              </div>
              <span
                className={`whitespace-nowrap text-xs font-medium ${
                  isActive ? "text-zinc-900" : "text-zinc-400"
                }`}
              >
                {item.label}
              </span>
            </div>
            {index < wizardSteps.length - 1 && (
              <div className="mx-3 mb-5 h-px flex-1 bg-zinc-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}
