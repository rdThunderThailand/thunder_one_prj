import { Card } from "@/components/ui/Card";
import { employeePolicyUpdates } from "../mock-data";
import type { PolicyUpdateData } from "../mock-data";

const badgeTone: Record<PolicyUpdateData["badge"], string> = {
  New: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  Updated: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
};

export function EmployeePolicyUpdatesCard() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Policy Updates</h2>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
        </button>
      </div>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {employeePolicyUpdates.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">{item.day}</span>
              <span className="text-[9px] uppercase text-zinc-400">{item.month}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="truncate text-xs text-zinc-400">{item.subtitle}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeTone[item.badge]}`}>
              {item.badge}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
