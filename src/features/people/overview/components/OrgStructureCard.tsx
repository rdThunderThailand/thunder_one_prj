import { Card } from "@/components/ui/Card";
import { ChevronRightIcon } from "@/components/ui/icons";
import { orgStructureRows } from "../mock-data";

export function OrgStructureCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">โครงสร้างองค์กร</h2>
        <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูทั้งหมด
        </button>
      </div>
      <ul className="flex flex-1 flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {orgStructureRows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
            <span className="truncate text-sm text-zinc-700 dark:text-zinc-200">{row.name}</span>
            <span className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              {row.count}
              <ChevronRightIcon className="h-3.5 w-3.5 text-zinc-300" />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
