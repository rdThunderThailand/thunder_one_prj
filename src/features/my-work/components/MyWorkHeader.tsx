import { SettingsIcon, StarIcon } from "@/components/ui/icons";

export function MyWorkHeader() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          My Work
          <StarIcon className="h-5 w-5 text-t1-gray-400" />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All your tasks, approvals, and important work in one place.
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
