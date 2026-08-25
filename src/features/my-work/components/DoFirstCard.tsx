import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { BoxIcon, CalendarIcon, MoreIcon, PlayIcon, StarIcon } from "@/components/ui/icons";
import { doFirstTask } from "../mock-data";

export function DoFirstCard() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          <StarIcon className="h-4 w-4 text-amber-500" filled />
          Do First
        </h2>
        <MoreIcon className="h-4 w-4 text-zinc-400" />
      </div>

      <span className="mb-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
        {doFirstTask.priority}
      </span>
      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{doFirstTask.title}</p>
      <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{doFirstTask.subtitle}</p>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <CalendarIcon className="h-3.5 w-3.5" />
          {doFirstTask.dueLabel}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <BoxIcon className="h-3.5 w-3.5" />
          {doFirstTask.project}
        </span>
        <div className="flex items-center -space-x-2">
          {doFirstTask.assignees.map((name) => (
            <Avatar key={name} name={name} size={24} className="ring-2 ring-white dark:ring-zinc-900" />
          ))}
          {doFirstTask.assigneesOverflow > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-500 ring-2 ring-white dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-900">
              +{doFirstTask.assigneesOverflow}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex flex-1 items-center gap-2">
          <span className="w-9 shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {doFirstTask.percent}%
          </span>
          <ProgressBar value={doFirstTask.percent} color="indigo" />
        </div>
        <button className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
          <PlayIcon className="h-3.5 w-3.5" />
          {doFirstTask.actionLabel}
        </button>
      </div>
    </div>
  );
}
