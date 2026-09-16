import { GaugeIcon } from "@/components/ui/icons";

export function EmployeeMyWorkHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Good morning, Ploy! <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Focus on what matters, one thing at a time, and finish with quality.
        </p>
      </div>
      <button
        type="button"
        title="Not built yet"
        className="flex shrink-0 cursor-not-allowed items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
      >
        <GaugeIcon className="h-4 w-4" />
        Focus mode
      </button>
    </div>
  );
}
