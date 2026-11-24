import type { DeviceProgress } from "./rollout-device-status";

const TONE = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", error: "bg-error", neutral: "bg-muted-foreground" } as const;

/** One device's bar: stepped by the stage the Player last reported (it sends stages, not percentages). */
export function StageBar({ progress }: { progress: DeviceProgress | null }) {
  if (!progress) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="grid w-40 gap-1">
      <div
        role="progressbar"
        aria-label={progress.label}
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.step}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className={`h-full ${TONE[progress.tone]}`} style={{ width: `${(progress.step / progress.total) * 100}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{progress.label}</span>
    </div>
  );
}

/** The rollout as one bar: each segment is a share of the devices that should get the version. */
export function StackedBar({ segments, total }: { segments: { label: string; count: number; tone: keyof typeof TONE }[]; total: number }) {
  return (
    <div role="img" aria-label={segments.map((segment) => `${segment.label} ${segment.count}`).join(", ")} className="flex h-3 overflow-hidden rounded-full bg-muted">
      {total > 0 && segments.map((segment) => (
        <div key={segment.label} className={TONE[segment.tone]} style={{ width: `${(segment.count / total) * 100}%` }} />
      ))}
    </div>
  );
}
