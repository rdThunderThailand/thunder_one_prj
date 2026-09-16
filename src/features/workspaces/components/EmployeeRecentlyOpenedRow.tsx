import { Card } from "@/components/ui/Card";
import { BoxIcon, ChartIcon, ChevronRightIcon, ImageIcon, MegaphoneIcon, UsersIcon } from "@/components/ui/icons";
import { employeeRecentlyOpened, type ManagerWorkspaceIcon } from "../mock-data";

const iconFor: Record<ManagerWorkspaceIcon, React.ReactNode> = {
  megaphone: <MegaphoneIcon className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
  users: <UsersIcon className="h-4 w-4" />,
  clipboard: <BoxIcon className="h-4 w-4" />,
  settings: <BoxIcon className="h-4 w-4" />,
  chart: <ChartIcon className="h-4 w-4" />,
  box: <BoxIcon className="h-4 w-4" />,
  grid: <BoxIcon className="h-4 w-4" />,
};

export function EmployeeRecentlyOpenedRow() {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Recently Opened</h2>
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {employeeRecentlyOpened.map((item) => (
          <Card key={item.id} className="flex min-w-44 shrink-0 items-center gap-2.5 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
              {iconFor[item.icon]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.label}</p>
              <p className="truncate text-xs text-zinc-400">{item.countLabel}</p>
            </div>
          </Card>
        ))}
        <button
          type="button"
          title="Not built yet"
          className="flex h-11 w-11 shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 dark:border-zinc-700"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
