import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, InfoIcon, MoreIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { employeeAttentionItems, type EmployeeAttentionItem } from "../mock-data";

const iconTone: Record<EmployeeAttentionItem["status"], string> = {
  overdue: "bg-error-muted text-error",
  waiting: "bg-info-muted text-info",
};

const badge: Record<EmployeeAttentionItem["status"], { label: string; tone: string }> = {
  overdue: { label: "Overdue", tone: "bg-error-muted text-t1-red-700" },
  waiting: { label: "Waiting", tone: "bg-info-muted text-t1-blue-700" },
};

export function EmployeeAttentionCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Needs Your Attention</h2>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-semibold text-error-foreground">
          {employeeAttentionItems.length}
        </span>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-border">
        {employeeAttentionItems.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconTone[item.status]}`}
            >
              {item.status === "overdue" ? <WarningTriangleIcon /> : <InfoIcon />}
            </span>
            <div className="min-w-0 flex-1 basis-48">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge[item.status].tone}`}>
                  {badge[item.status].label}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
              <p className="text-xs text-t1-gray-400">{item.meta}</p>
            </div>
            <button className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-t1-gray-50">
              {item.actionLabel}
            </button>
            <MoreIcon className="h-4 w-4 shrink-0 text-t1-gray-400" />
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent-foreground">
        View all ({employeeAttentionItems.length})
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
