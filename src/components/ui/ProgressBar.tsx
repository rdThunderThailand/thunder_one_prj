type ProgressBarColor = "indigo" | "emerald" | "red" | "amber";

interface ProgressBarProps {
  value: number;
  color?: ProgressBarColor;
  className?: string;
  /** Overlay a moving sheen, for a bar whose underlying job is still running. */
  animated?: boolean;
}

const barColor: Record<ProgressBarColor, string> = {
  indigo: "bg-primary",
  emerald: "bg-success",
  red: "bg-error",
  amber: "bg-warning",
};

export function ProgressBar({
  value,
  color = "indigo",
  className = "",
  animated = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-muted ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${barColor[color]} ${
          animated ? "progress-stripes" : ""
        }`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
