import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, BoxIcon, ChevronRightIcon, ClipboardIcon, ShieldIcon, UsersIcon } from "@/components/ui/icons";
import { employeeGovernanceTasks, type GovernanceTaskData } from "../mock-data";

const iconFor: Record<GovernanceTaskData["icon"], React.ReactNode> = {
  shield: <ShieldIcon />,
  users: <UsersIcon />,
  document: <ClipboardIcon />,
  folder: <BoxIcon />,
};

const tone: Record<GovernanceTaskData["icon"], string> = {
  shield: "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400",
  users: "bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
  document: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400",
  folder: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
};

export function EmployeeGovernanceTasksCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">My Governance Tasks</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {employeeGovernanceTasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2.5 py-3 first:pt-0 last:pb-0">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone[task.icon]}`}>
              {iconFor[task.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{task.title}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{task.subtitle}</p>
              <p className="text-xs font-medium text-red-500">{task.due}</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-300" />
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1.5 border-t border-zinc-100 pt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:border-zinc-800 dark:text-indigo-400">
        View all tasks
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
