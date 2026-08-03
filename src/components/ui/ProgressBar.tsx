type ProgressBarColor = "indigo" | "emerald" | "red" | "amber";

interface ProgressBarProps {
  value: number;
  color?: ProgressBarColor;
  className?: string;
}

const barColor: Record<ProgressBarColor, string> = {
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
};

export function ProgressBar({
  value,
  color = "indigo",
  className = "",
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${barColor[color]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
