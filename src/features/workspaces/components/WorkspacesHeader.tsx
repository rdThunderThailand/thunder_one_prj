import { SparklesIcon } from "@/components/ui/icons";

export function WorkspacesHeader() {
  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Workspaces
        <SparklesIcon className="h-5 w-5 text-indigo-500" />
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Open specialized workspaces to create, manage, and operate with full capability.
      </p>
    </div>
  );
}
