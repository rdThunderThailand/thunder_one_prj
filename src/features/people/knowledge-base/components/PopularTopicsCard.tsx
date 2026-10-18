import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, EyeIcon } from "@/components/ui/icons";
import { popularTopics } from "../mock-data";

export function PopularTopicsCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">หัวข้อยอดนิยม</h2>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1 text-xs font-medium text-primary"
        >
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </span>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {popularTopics.map((topic) => (
          <li key={topic.rank} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
              {topic.rank}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{topic.label}</span>
            <span className="flex shrink-0 items-center gap-1 text-xs text-t1-gray-400">
              <EyeIcon className="h-3 w-3" />
              {topic.viewCount}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
