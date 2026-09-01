import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, EyeIcon } from "@/components/ui/icons";
import { popularTopics } from "../mock-data";

export function PopularTopicsCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">หัวข้อยอดนิยม</h2>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </span>
      </div>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {popularTopics.map((topic) => (
          <li key={topic.rank} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {topic.rank}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-200">{topic.label}</span>
            <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-400">
              <EyeIcon className="h-3 w-3" />
              {topic.viewCount}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
