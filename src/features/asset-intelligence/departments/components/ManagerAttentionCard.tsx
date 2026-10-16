import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CheckCircleIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { managerAttentionItems, type ManagerAttentionItem } from "../mock-data";

const iconTone: Record<ManagerAttentionItem["status"], string> = {
  overdue: "bg-error-muted text-error",
  "at-risk": "bg-warning-muted text-warning",
  waiting: "bg-info-muted text-info",
};

const statusBadge: Record<ManagerAttentionItem["status"], { label: string; tone: string }> = {
  overdue: { label: "Overdue", tone: "bg-error-muted text-t1-red-700" },
  "at-risk": { label: "At Risk", tone: "bg-warning-muted text-t1-amber-700" },
  waiting: { label: "Waiting", tone: "bg-info-muted text-t1-blue-700" },
};

const actionButton: Record<ManagerAttentionItem["status"], string> = {
  overdue: "border border-border text-foreground hover:bg-muted",
  "at-risk": "border border-border text-foreground hover:bg-muted",
  waiting: "bg-primary text-primary-foreground hover:bg-primary/90",
};

export function ManagerAttentionCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <WarningTriangleIcon className="h-4 w-4 text-error" />
        <h2 className="flex-1 text-sm font-semibold text-foreground">Needs Your Attention</h2>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-semibold text-error-foreground">
          {managerAttentionItems.length}
        </span>
      </div>

      <ul className="flex flex-1 flex-col divide-y divide-border">
        {managerAttentionItems.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTone[item.status]}`}
            >
              {item.status === "waiting" ? <CheckCircleIcon /> : <WarningTriangleIcon />}
            </span>
            <div className="min-w-0 flex-1 basis-48">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadge[item.status].tone}`}
                >
                  {statusBadge[item.status].label}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
              <p className="text-xs text-t1-gray-400">{item.meta}</p>
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
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent-foreground"
      >
        View all ({managerAttentionItems.length})
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
