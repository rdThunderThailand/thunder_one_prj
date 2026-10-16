import Link from "next/link";
import { PlusIcon } from "@/components/ui/icons";
import { dashboardActionBar } from "../mock-data";

export function DashboardActionBar() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
      {dashboardActionBar.map((item, index) => {
        const body = (
          <>
            {index === 0 && <PlusIcon className="h-3.5 w-3.5" />}
            {item.label}
            {item.badge !== undefined && (
              <span className="rounded-full bg-error px-1.5 py-0.5 text-[10px] font-semibold text-error-foreground">
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
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {body}
            </Link>
          );
        }

        return (
          <span
            key={item.id}
            title="Not built yet"
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-t1-gray-400"
          >
            {body}
          </span>
        );
      })}
    </div>
  );
}
