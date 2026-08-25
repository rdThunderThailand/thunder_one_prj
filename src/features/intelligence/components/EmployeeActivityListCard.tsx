import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { employeeIntelActivity } from "../mock-data";

export function EmployeeActivityListCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Team Activity</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {employeeIntelActivity.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5">
            <Avatar name={item.name} size={26} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</span> {item.action}{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.target}</span>
              </p>
              <p className="text-xs text-zinc-400">{item.timeAgo}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
