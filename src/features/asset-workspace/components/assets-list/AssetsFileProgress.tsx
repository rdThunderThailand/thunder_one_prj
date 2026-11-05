import { DownloadIcon, FileTextIcon } from "@/components/ui/icons";
import { Progress } from "@/components/ui/lovable/progress";

export function AssetsFileProgress({ kind, description, stage, steps }: {
  kind: "assets" | "template";
  description: string;
  stage: string;
  steps?: { completed: number; total: number };
}) {
  const Icon = kind === "assets" ? DownloadIcon : FileTextIcon;
  const percent = steps ? Math.round((steps.completed / steps.total) * 100) : undefined;
  const progressText = steps ? `${steps.completed} of ${steps.total} preparation steps completed` : stage;
  return (
    <div aria-busy="true" className="space-y-4 py-4 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-info-muted text-primary">
        <Icon aria-hidden="true" className="size-6" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold">{description}</p>
        <p role="status" className="text-xs text-muted-foreground">{stage}</p>
      </div>
      {steps && (
        <div className="flex items-center justify-between gap-3 text-xs tabular-nums">
          <span className="text-muted-foreground">{progressText}</span>
          <span className="font-semibold">{percent}%</span>
        </div>
      )}
      <Progress
        value={percent}
        indeterminate={!steps}
        aria-valuetext={progressText}
        aria-label={kind === "assets" ? "Preparing asset export" : "Preparing import template"}
        className="h-2 bg-muted"
        indicatorClassName="duration-500 ease-out motion-reduce:transition-none"
      />
      <p className="text-2xs leading-relaxed text-muted-foreground">
        Your browser will handle the download when the file is ready.
      </p>
    </div>
  );
}
