import { GridIcon, SettingsIcon } from "@/components/ui/icons";

export function EmployeeWorkspacesHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          Workspaces
          <GridIcon className="h-5 w-5 text-primary" />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Specialized workspaces to help you work efficiently.
        </p>
      </div>
      <button
        type="button"
        title="Not built yet"
        className="flex shrink-0 cursor-not-allowed items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground"
      >
        Customize
        <SettingsIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
