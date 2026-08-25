import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, InfoIcon, MoreIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { employeeAttentionItems, type EmployeeAttentionItem } from "../mock-data";

const iconTone: Record<EmployeeAttentionItem["status"], string> = {
  overdue: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  waiting: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
};

const badge: Record<EmployeeAttentionItem["status"], { label: string; tone: string }> = {
  overdue: { label: "Overdue", tone: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" },
  waiting: { label: "Waiting", tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
};

export function EmployeeAttentionCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Needs Your Attention</h2>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
          {employeeAttentionItems.length}
        </span>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {employeeAttentionItems.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTone[item.status]}`}
            >
              {item.status === "overdue" ? <WarningTriangleIcon /> : <InfoIcon />}
            </span>
            <div className="min-w-0 flex-1 basis-48">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge[item.status].tone}`}>
                  {badge[item.status].label}
                </span>
              </div>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.subtitle}</p>
              <p className="text-xs text-zinc-400">{item.meta}</p>
            </div>
            <button className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
              {item.actionLabel}
            </button>
            <MoreIcon className="h-4 w-4 shrink-0 text-zinc-300" />
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
        View all ({employeeAttentionItems.length})
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
