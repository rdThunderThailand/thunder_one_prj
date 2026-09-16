import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CheckCircleIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { managerAttentionItems, type ManagerAttentionItem } from "../mock-data";

const iconTone: Record<ManagerAttentionItem["status"], string> = {
  overdue: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  "at-risk": "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  waiting: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
};

const statusBadge: Record<ManagerAttentionItem["status"], { label: string; tone: string }> = {
  overdue: { label: "Overdue", tone: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" },
  "at-risk": { label: "At Risk", tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  waiting: { label: "Waiting", tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
};

const actionButton: Record<ManagerAttentionItem["status"], string> = {
  overdue: "border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800",
  "at-risk": "border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800",
  waiting: "bg-indigo-600 text-white hover:bg-indigo-500",
};

export function ManagerAttentionCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <WarningTriangleIcon className="h-4 w-4 text-red-500" />
        <h2 className="flex-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Needs Your Attention</h2>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
          {managerAttentionItems.length}
        </span>
      </div>

      <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {managerAttentionItems.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTone[item.status]}`}
            >
              {item.status === "waiting" ? <CheckCircleIcon /> : <WarningTriangleIcon />}
            </span>
            <div className="min-w-0 flex-1 basis-48">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadge[item.status].tone}`}
                >
                  {statusBadge[item.status].label}
                </span>
              </div>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.subtitle}</p>
              <p className="text-xs text-zinc-400">{item.meta}</p>
            </div>
            <Avatar name={item.assignee} size={26} />
            <button
              type="button"
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${actionButton[item.status]}`}
            >
              {item.actionLabel}
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        View all ({managerAttentionItems.length})
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
