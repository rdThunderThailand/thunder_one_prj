import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, ClipboardIcon, UsersIcon } from "@/components/ui/icons";
import { managerDecisions } from "../mock-data";

const icons = [<ClipboardIcon key="0" />, <UsersIcon key="1" />, <CheckCircleIcon key="2" />];

export function ManagerDecisionsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Decisions Today</h2>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
        </button>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {managerDecisions.map((decision, index) => (
          <li key={decision.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              {icons[index % icons.length]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{decision.title}</p>
              <p className="truncate text-xs text-zinc-400">{decision.detail}</p>
            </div>
            <button className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-indigo-500">
              Decide
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
