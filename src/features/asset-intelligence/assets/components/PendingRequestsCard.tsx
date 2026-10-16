import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ChevronRightIcon } from "@/components/ui/icons";
import { pendingRequests, type PendingRequestData } from "../mock-data";

const priorityColor: Record<PendingRequestData["priority"], "red" | "zinc"> = {
  เร่งด่วน: "red",
  ปกติ: "zinc",
};

export function PendingRequestsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">คำขอที่ต้องดำเนินการ</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary">
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-border">
        {pendingRequests.map((item) => (
          <li key={item.id} className="flex items-start gap-2 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-t1-gray-400">{item.code}</span>
                <Badge variant="pill" color={priorityColor[item.priority]}>
                  {item.priority}
                </Badge>
              </div>
              <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
              <p className="text-xs text-t1-gray-400">{item.timeAgo}</p>
            </div>
            <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-t1-gray-400" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
