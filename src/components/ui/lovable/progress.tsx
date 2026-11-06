import { cn } from "@/lib/utils";

// Native ARIA progress markup; indicator animation is opt-in.
function Progress({
  value = 0,
  indeterminate = false,
  className,
  indicatorClassName,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value?: number; indeterminate?: boolean; indicatorClassName?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : value}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all",
          // Reuse the existing travelling animation without implying a percentage.
          indeterminate && "w-1/3 animate-[stage-flow_1.4s_ease-in-out_infinite] motion-reduce:animate-none",
          indicatorClassName,
        )}
        style={indeterminate ? undefined : { transform: `translateX(-${100 - value}%)` }}
      />
    </div>
  );
}

export { Progress };
