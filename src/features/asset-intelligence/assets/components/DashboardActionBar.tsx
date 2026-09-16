import Link from "next/link";
import { PlusIcon } from "@/components/ui/icons";
import { dashboardActionBar } from "../mock-data";

export function DashboardActionBar() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      {dashboardActionBar.map((item, index) => {
        const body = (
          <>
            {index === 0 && <PlusIcon className="h-3.5 w-3.5" />}
            {item.label}
            {item.badge !== undefined && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {item.badge}
              </span>
            )}
          </>
        );

        if (item.href) {
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {body}
            </Link>
          );
        }

        return (
          <span
            key={item.id}
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-400 dark:border-zinc-800"
          >
            {body}
          </span>
        );
      })}
    </div>
  );
}
