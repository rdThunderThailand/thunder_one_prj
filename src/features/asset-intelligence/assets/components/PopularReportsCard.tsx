import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ChevronRightIcon, ClipboardIcon } from "@/components/ui/icons";
import { popularReports } from "../mock-data";

export function PopularReportsCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">รายงานยอดนิยม</h2>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {popularReports.map((report) => (
          <li key={report.id}>
            <div
              title="Not built yet"
              className="flex cursor-not-allowed items-center gap-2.5 py-2.5 text-sm text-zinc-600 dark:text-zinc-300"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                <ClipboardIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{report.title}</p>
                <p className="truncate text-xs text-zinc-400">{report.subtitle}</p>
              </div>
              <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
            </div>
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1.5 border-t border-zinc-100 pt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:border-zinc-800 dark:text-indigo-400">
        ดูรายงานทั้งหมด
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
