import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { pendingApprovals, type PendingApprovalData } from "../mock-data";

const typeTone: Record<PendingApprovalData["type"], string> = {
  Policy: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  Budget: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  Vendor: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
};

const priorityColor: Record<PendingApprovalData["priority"], "red" | "yellow"> = {
  High: "red",
  Medium: "yellow",
};

export function PendingApprovalsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Pending Approvals</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {pendingApprovals.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0">
            <Avatar name={item.requester} size={30} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
                <Badge color={priorityColor[item.priority]} variant="pill" className="shrink-0">
                  {item.priority}
                </Badge>
              </div>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.subtitle}</p>
              <p className="text-xs text-zinc-400">Requested by {item.requester}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${typeTone[item.type]}`}>
                {item.type}
              </span>
              <span className="text-xs text-zinc-400">{item.timeAgo}</span>
            </div>
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1.5 border-t border-zinc-100 pt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:border-zinc-800 dark:text-indigo-400">
        View all approvals
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
