import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { actionItems } from "../mock-data";

const DOT_COLOR = { red: "bg-red-500", blue: "bg-blue-500" } as const;

// "งานที่ต้องดำเนินการ" — mock (`../mock-data.ts`'s `actionItems`); no real
// cross-App task/approval-aggregation backend exists yet. Replaces the old
// NeedsAttentionCard (same underlying idea, restyled to match the new
// mockup's dot+time-ago list instead of icon-badge+severity-chip rows).
export function TasksCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">งานที่ต้องดำเนินการ</h2>
        <Link
          href="/my-work"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {actionItems.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT_COLOR[item.tone]}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="text-xs text-zinc-400">{item.source}</p>
            </div>
            <span className="shrink-0 whitespace-nowrap text-xs text-zinc-400">{item.timeAgo}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
