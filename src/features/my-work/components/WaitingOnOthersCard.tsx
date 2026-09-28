import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowRightIcon, ClockIcon } from "@/components/ui/icons";
import type { WorkItem } from "../work-items";

export function WaitingOnOthersCard({ items }: { items: WorkItem[] }) {
  const waiting = items.filter((item) => item.kind === "waiting");

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Waiting on Others</h2>
      {waiting.length === 0 ? (
        <EmptyState
          icon={ClockIcon}
          title="Not waiting on anyone"
          detail="Things you're waiting on from others will show here."
          compact
        />
      ) : (
        <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
          {waiting.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400">
                <ClockIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
                <p className="truncate text-xs text-zinc-400">{item.dateNote}</p>
              </div>
              <Link
                href={item.href}
                aria-label={`Open ${item.title}`}
                className="shrink-0 text-zinc-400 hover:text-indigo-600"
              >
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
