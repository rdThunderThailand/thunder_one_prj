import { Card } from "@/components/ui/Card";
import { CalendarIcon, ChartIcon, ChevronRightIcon, CheckCircleIcon, MegaphoneIcon, UploadIcon } from "@/components/ui/icons";
import { employeeQuickAccess, type QuickAccessItemData } from "../mock-data";

const iconFor: Record<QuickAccessItemData["icon"], React.ReactNode> = {
  campaign: <MegaphoneIcon />,
  upload: <UploadIcon />,
  task: <CheckCircleIcon />,
  reports: <ChartIcon />,
  calendar: <CalendarIcon />,
  approvals: <CheckCircleIcon />,
};

// Decorative — no create/upload/task/report/calendar flow exists yet.
export function EmployeeQuickAccessCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Quick Access</h2>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {employeeQuickAccess.map((item) => (
          <li key={item.id}>
            <div
              title="Not built yet"
              className="flex cursor-not-allowed items-center gap-2.5 py-2.5 text-sm text-zinc-600 dark:text-zinc-300"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                {iconFor[item.icon]}
              </span>
              <span className="flex-1">{item.label}</span>
              <ChevronRightIcon className="h-3.5 w-3.5 text-zinc-300" />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
