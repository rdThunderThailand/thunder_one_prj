import { CheckIcon } from "@/components/ui/icons";

/** Frame 16 / 20 step bar: circle with its label beside it, a line between steps. The shared WizardSteps puts labels
 *  under the circles and spans the page, so the action pages keep this small local copy instead of changing it. */
export function ActionSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol
      aria-label="Steps"
      className="flex min-w-0 items-center gap-3"
    >
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={`flex min-w-0 items-center gap-3 ${index < steps.length - 1 ? "flex-1" : ""}`}
          >
            <span className="flex shrink-0 items-center gap-2">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  done || active ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground"
                }`}
              >
                {done ? (
                  <CheckIcon
                    aria-hidden="true"
                    className="size-3.5"
                  />
                ) : index + 1}
              </span>
              <span
                className={`text-xs ${active || done ? "font-medium text-accent-foreground" : "text-muted-foreground"} ${active ? "" : "max-sm:sr-only"}`}
              >
                {label}
                {done && <span className="sr-only"> (done)</span>}
              </span>
            </span>
            {index < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`h-px min-w-4 flex-1 ${done ? "bg-primary" : "bg-border"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
