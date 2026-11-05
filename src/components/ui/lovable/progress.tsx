import { cn } from "@/lib/utils";

// Native ARIA progress markup; indicator animation is opt-in.
function Progress({
  value = 0,
  className,
  indicatorClassName,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value?: number; indicatorClassName?: string }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
      {...props}
    >
      <div
        className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)}
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </div>
  );
}

export { Progress };
