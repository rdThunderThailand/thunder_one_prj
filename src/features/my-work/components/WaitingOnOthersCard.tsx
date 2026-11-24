import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowRightIcon, ClockIcon } from "@/components/ui/icons";
import type { WorkItem } from "../work-items";

export function WaitingOnOthersCard({ items }: { items: WorkItem[] }) {
  const waiting = items.filter((item) => item.kind === "waiting");

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Waiting on Others</h2>
      {waiting.length === 0 ? (
        <EmptyState
          icon={ClockIcon}
          title="Not waiting on anyone"
          detail="Things you're waiting on from others will show here."
          compact
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {waiting.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-in-progress-muted text-in-progress">
                <ClockIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <p className="truncate text-xs text-t1-gray-400">{item.dateNote}</p>
              </div>
              <Link
                href={item.href}
                aria-label={`Open ${item.title}`}
                className="shrink-0 text-t1-gray-400 hover:text-primary"
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
