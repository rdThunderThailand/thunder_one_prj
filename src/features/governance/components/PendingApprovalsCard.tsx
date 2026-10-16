import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { pendingApprovals, type PendingApprovalData } from "../mock-data";

const typeTone: Record<PendingApprovalData["type"], string> = {
  Policy: "bg-accent text-primary",
  Budget: "bg-info-muted text-t1-blue-700",
  Vendor: "bg-in-progress-muted text-t1-purple-700",
};

const priorityColor: Record<PendingApprovalData["priority"], "red" | "yellow"> = {
  High: "red",
  Medium: "yellow",
};

export function PendingApprovalsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Pending Approvals</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-border">
        {pendingApprovals.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0">
            <Avatar name={item.requester} size={30} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <Badge color={priorityColor[item.priority]} variant="pill" className="shrink-0">
                  {item.priority}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
              <p className="text-xs text-t1-gray-400">Requested by {item.requester}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${typeTone[item.type]}`}>
                {item.type}
              </span>
              <span className="text-xs text-t1-gray-400">{item.timeAgo}</span>
            </div>
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-sm font-medium text-primary hover:text-accent-foreground">
        View all approvals
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
