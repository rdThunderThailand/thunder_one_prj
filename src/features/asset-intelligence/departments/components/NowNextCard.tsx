import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { managerNextItems, managerNowItems } from "../mock-data";

export function NowNextCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Now &amp; Next</h2>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          View full calendar
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Now
          </p>
          <ul className="space-y-2.5">
            {managerNowItems.map((item, index) => (
              <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
                  <p className="truncate text-xs text-zinc-400">{item.subtitle}</p>
                </div>
                {index === 0 && (
                  <span className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">
                    Join
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-zinc-100 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 dark:border-zinc-800">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Next (Today)</p>
          <ul className="space-y-2.5">
            {managerNextItems.map((item) => (
              <li key={item.id} className="text-sm">
                <p className="text-xs text-zinc-400">{item.when}</p>
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
                <p className="truncate text-xs text-zinc-400">{item.subtitle}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
