import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { dashboardNotifications, type DashboardNotificationRow } from "../mock-data";

const dotColor: Record<DashboardNotificationRow["severity"], string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
};

export function DashboardNotificationsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">การแจ้งเตือน</h2>
      <ul className="flex flex-1 flex-col gap-3">
        {dashboardNotifications.map((item) => (
          <li key={item.id} className="flex items-start gap-2">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotColor[item.severity]}`} aria-hidden="true" />
            <p className="flex-1 text-sm text-zinc-700 dark:text-zinc-200">{item.text}</p>
            <span className="shrink-0 rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {item.count}
            </span>
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1.5 border-t border-zinc-100 pt-3 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:border-zinc-800 dark:text-indigo-400">
        ดูการแจ้งเตือนทั้งหมด
        <ArrowRightIcon className="h-3 w-3" />
      </button>
    </Card>
  );
}
