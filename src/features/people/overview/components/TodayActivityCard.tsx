import { Card } from "@/components/ui/Card";
import { todayActivities, type ActivityTag } from "../mock-data";

const tagStyle: Record<ActivityTag, { label: string; tone: string }> = {
  onboarding: { label: "Onboarding", tone: "text-indigo-600 dark:text-indigo-400" },
  change: { label: "Change", tone: "text-blue-600 dark:text-blue-400" },
  meeting: { label: "Meeting", tone: "text-zinc-500 dark:text-zinc-400" },
  training: { label: "Training", tone: "text-emerald-600 dark:text-emerald-400" },
  offboarding: { label: "Offboarding", tone: "text-red-600 dark:text-red-400" },
};

export function TodayActivityCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">กิจกรรมวันนี้</h2>
        <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูปฏิทินทั้งหมด
        </button>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {todayActivities.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="w-12 shrink-0 text-xs font-medium text-zinc-400">{item.time}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.subtitle}</p>
            </div>
            <span className={`shrink-0 text-xs font-medium ${tagStyle[item.tag].tone}`}>{tagStyle[item.tag].label}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
