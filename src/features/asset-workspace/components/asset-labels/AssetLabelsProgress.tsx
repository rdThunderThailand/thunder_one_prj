import { CheckCircleIcon, ClockIcon, PrintIcon, SpinnerIcon } from "@/components/ui/icons";
import { Progress } from "@/components/ui/lovable/progress";

export function AssetLabelsProgress({ completed, total, preparation }: {
  completed: number;
  total: number;
  preparation?: { tools: boolean; data: boolean; preview: boolean };
}) {
  const steps = preparation ? [
    { label: "Prepare label format", done: preparation.tools, active: !preparation.tools },
    { label: "Load selected asset data", done: preparation.data, active: !preparation.data },
    { label: "Prepare label preview", done: preparation.preview, active: preparation.tools && preparation.data },
  ] : null;
  // PDF work consists of each label page, followed by serialization of the complete file.
  const totalSteps = steps?.length ?? total + 1;
  const completedSteps = steps ? steps.filter((step) => step.done).length : completed;
  const percent = Math.floor(completedSteps / totalSteps * 100);
  const progressText = `${completedSteps} of ${totalSteps} preparation steps completed`;
  const stage = preparation
    ? !preparation.data ? "Loading selected asset data…"
      : !preparation.tools ? "Preparing the label format…" : "Preparing the label preview…"
    : completed >= total ? "Finalizing the PDF…" : `${completed.toLocaleString("en-GB")} of ${total.toLocaleString("en-GB")} labels prepared`;

  return (
    <div aria-busy="true" className="space-y-4 py-4 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-info-muted text-primary">
        <PrintIcon aria-hidden="true" className="size-6" />
      </span>
      <p role="status" className="text-sm font-semibold tabular-nums">
        {stage}
      </p>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3 text-xs tabular-nums">
          <span className="text-muted-foreground">{progressText}</span>
          <span className="font-semibold">{percent}%</span>
        </div>
        <Progress value={percent} aria-valuetext={progressText} aria-label={preparation ? "Preparing label preview" : "Preparing PDF"}
          className="h-2 bg-muted" indicatorClassName="duration-300 ease-out motion-reduce:transition-none" />
      </div>
      {steps && (
        <ul className="space-y-2 text-left text-xs">
          {steps.map((step) => {
            const Icon = step.done ? CheckCircleIcon : step.active ? SpinnerIcon : ClockIcon;
            return (
              <li key={step.label} className="flex items-center gap-2">
                <Icon aria-hidden="true" className={`size-4 shrink-0 ${step.done ? "text-success" : step.active ? "animate-spin text-primary motion-reduce:animate-none" : "text-muted-foreground"}`} />
                <span className={step.done ? "text-foreground" : "text-muted-foreground"}>{step.label}</span>
                <span className="sr-only">{step.done ? "Complete" : step.active ? "In progress" : "Pending"}</span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">
        {preparation ? "Progress updates when a preparation step finishes." : "No file will be downloaded until you choose Download."}
      </p>
    </div>
  );
}
