import { SettingsIcon, ShieldIcon } from "@/components/ui/icons";

export function EmployeeGovernanceHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Governance
          <ShieldIcon className="h-5 w-5 text-indigo-500" />
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Policy, standards, and controls to keep the organization transparent and safe.
        </p>
      </div>
      <button
        type="button"
        className="flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Customize
        <SettingsIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
