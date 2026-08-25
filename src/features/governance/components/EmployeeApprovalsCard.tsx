import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ClipboardIcon } from "@/components/ui/icons";
import { employeeApprovals } from "../mock-data";

export function EmployeeApprovalsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Approvals</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {employeeApprovals.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5 py-3 first:pt-0 last:pb-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
              <ClipboardIcon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.department}</p>
              <p className="text-xs text-zinc-400">
                Requested by {item.requestedBy} · {item.timeAgo}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              Pending
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
