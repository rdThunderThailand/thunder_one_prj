import { Card } from "@/components/ui/Card";
import { HelpIcon } from "@/components/ui/icons";

export function NeedHelpCard() {
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Need help?</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Learn how to get the most out of ThunderOne workspaces.
        </p>
        <span
          className="mt-2 flex cursor-not-allowed items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400"
          title="Not built yet"
        >
          View Help Center
        </span>
      </div>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
        <HelpIcon className="h-6 w-6" />
      </span>
    </Card>
  );
}
