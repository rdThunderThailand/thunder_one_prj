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
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">คำขอที่ต้องดำเนินการ</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {pendingRequests.map((item) => (
          <li key={item.id} className="flex items-start gap-2 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400">{item.code}</span>
                <Badge variant="pill" color={priorityColor[item.priority]}>
                  {item.priority}
                </Badge>
              </div>
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.subtitle}</p>
              <p className="text-xs text-zinc-400">{item.timeAgo}</p>
            </div>
            <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-zinc-300" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
