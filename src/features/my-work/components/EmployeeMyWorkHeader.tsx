import { GaugeIcon } from "@/components/ui/icons";

/** Morning/afternoon/evening by the Bangkok clock, so the greeting matches
 *  the user's day rather than the server's. */
function greeting(now: Date): string {
  const hour = Number(now.toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Bangkok" }));
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function EmployeeMyWorkHeader({ userName, now }: { userName: string; now: Date }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting(now)}, {userName}! <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Focus on what matters, one thing at a time, and finish with quality.
        </p>
      </div>
      <button
        type="button"
        title="Not built yet"
        className="flex shrink-0 cursor-not-allowed items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground"
      >
        <GaugeIcon className="h-4 w-4" />
        Focus mode
      </button>
    </div>
  );
}
