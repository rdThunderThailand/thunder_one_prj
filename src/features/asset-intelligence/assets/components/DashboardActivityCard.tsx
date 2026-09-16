import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { dashboardActivity } from "../mock-data";

export function DashboardActivityCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">กิจกรรมล่าสุด</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {dashboardActivity.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-700 dark:text-zinc-200">{item.text}</p>
              <p className="text-xs text-zinc-400">{item.timeAgo}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
