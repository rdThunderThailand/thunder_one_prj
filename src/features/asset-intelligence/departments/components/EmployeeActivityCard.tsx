import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CheckCircleIcon, EnvelopeIcon, UploadIcon } from "@/components/ui/icons";
import { employeeActivity, type EmployeeActivityItem } from "../mock-data";

const iconFor: Record<EmployeeActivityItem["icon"], React.ReactNode> = {
  approve: <CheckCircleIcon className="h-3.5 w-3.5" />,
  upload: <UploadIcon className="h-3.5 w-3.5" />,
  comment: <EnvelopeIcon className="h-3.5 w-3.5" />,
};

const tone: Record<EmployeeActivityItem["icon"], string> = {
  approve: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
  upload: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  comment: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400",
};

export function EmployeeActivityCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recent Activity</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {employeeActivity.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5">
            <Avatar name={item.name} size={26} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.name}</span> {item.action}{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{item.target}</span>
              </p>
              <p className="text-xs text-zinc-400">{item.timeAgo}</p>
            </div>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone[item.icon]}`}>
              {iconFor[item.icon]}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
