import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ClockIcon, MoreIcon } from "@/components/ui/icons";
import { waitingOnOthers } from "../mock-data";

export function WaitingOnOthersCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Waiting on Others</h2>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {waitingOnOthers.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400">
              <ClockIcon />
            </span>
            <div className="min-w-0 flex-1 basis-48">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.subtitle}</p>
              <p className="text-xs text-zinc-400">{item.requestedOn}</p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              {item.statusLabel}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              <Avatar name={item.person} size={24} />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.person}</span>
            </div>
            <MoreIcon className="h-4 w-4 shrink-0 text-zinc-300" />
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1.5 border-t border-zinc-100 pt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:border-zinc-800 dark:text-indigo-400">
        View all waiting items
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
