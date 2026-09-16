import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, PlusIcon, RepeatIcon, SearchIcon, UsersIcon } from "@/components/ui/icons";
import { dashboardQuickActions, type QuickActionData } from "../mock-data";

const iconFor: Record<QuickActionData["icon"], React.ReactNode> = {
  add: <PlusIcon />,
  scanQr: <SearchIcon />,
  allocate: <UsersIcon />,
  transfer: <RepeatIcon />,
  borrowReturn: <RepeatIcon />,
  count: <CheckCircleIcon />,
};

export function DashboardQuickActionsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">ทางลัด</h2>
      <div className="grid flex-1 grid-cols-3 gap-2.5 content-center">
        {dashboardQuickActions.map((action) => (
          <div
            key={action.id}
            title="Not built yet"
            className="flex cursor-not-allowed flex-col items-center gap-1.5 rounded-lg border border-zinc-100 p-2.5 text-center dark:border-zinc-800"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
              {iconFor[action.icon]}
            </span>
            <span className="text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">{action.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
