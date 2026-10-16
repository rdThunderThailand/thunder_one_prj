import { GaugeIcon, SettingsIcon } from "@/components/ui/icons";

export function ManagerMissionControlHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          Mission Control
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your team&apos;s overview and what needs your focus today.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Customize
          <SettingsIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-t1-gray-400"
        >
          Focus Mode
          <GaugeIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
