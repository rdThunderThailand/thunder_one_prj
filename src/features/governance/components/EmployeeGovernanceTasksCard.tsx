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
  shield: "bg-accent text-primary",
  users: "bg-info-muted text-info",
  document: "bg-in-progress-muted text-in-progress",
  folder: "bg-warning-muted text-warning",
};

export function EmployeeGovernanceTasksCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">My Governance Tasks</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {employeeGovernanceTasks.map((task) => (
          <li key={task.id} className="flex items-center gap-2.5 py-3 first:pt-0 last:pb-0">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone[task.icon]}`}>
              {iconFor[task.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
              <p className="truncate text-xs text-muted-foreground">{task.subtitle}</p>
              <p className="text-xs font-medium text-error">{task.due}</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-t1-gray-400" />
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-sm font-medium text-primary hover:text-accent-foreground">
        View all tasks
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
