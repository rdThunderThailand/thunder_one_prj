import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { attentionItems, attentionTotalCount, type AttentionStatus } from "../mock-data";

const statusBadge: Record<AttentionStatus, { label: string; tone: string }> = {
  pending: { label: "รอดำเนินการ", tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  "awaiting-approval": {
    label: "รออนุมัติ",
    tone: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  },
  "awaiting-response": { label: "รอตอบรับ", tone: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
  overdue: { label: "เกินกำหนด", tone: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" },
};

export function AttentionListCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">งานที่ต้องให้ความสนใจ</h2>

      <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {attentionItems.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <Avatar name={item.name} size={32} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.name}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadge[item.status].tone}`}
                >
                  {statusBadge[item.status].label}
                </span>
              </div>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.dateLabel}</p>
              <p className={`text-xs font-medium ${item.dueUrgent ? "text-red-500" : "text-zinc-400"}`}>
                {item.dueLabel}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
      >
        ดูทั้งหมด ({attentionTotalCount})
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
