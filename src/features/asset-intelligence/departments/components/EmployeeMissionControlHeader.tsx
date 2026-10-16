import { SettingsIcon } from "@/components/ui/icons";

export function EmployeeMissionControlHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mission Control</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          An overview of what matters in the organization, and what&apos;s relevant to you.
        </p>
      </div>
      <button
        type="button"
        className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
      >
        Customize
        <SettingsIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
