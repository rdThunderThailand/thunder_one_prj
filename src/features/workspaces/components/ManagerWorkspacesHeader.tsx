import { GridIcon, MoreIcon, SettingsIcon } from "@/components/ui/icons";

export function ManagerWorkspacesHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          Workspaces
          <GridIcon className="h-5 w-5 text-primary" />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your workplace and tools, so you can work efficiently.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          title="Not built yet"
          className="flex shrink-0 cursor-not-allowed items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground"
        >
          Customize
          <SettingsIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Not built yet"
          className="flex cursor-not-allowed items-center justify-center rounded-lg border border-border p-2 text-t1-gray-400"
        >
          <MoreIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
