import { Card } from "@/components/ui/Card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { managerNextItems, managerNowItems } from "../mock-data";

export function NowNextCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Now &amp; Next</h2>
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground"
        >
          View full calendar
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Now
          </p>
          <ul className="space-y-2.5">
            {managerNowItems.map((item, index) => (
              <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{item.title}</p>
                  <p className="truncate text-xs text-t1-gray-400">{item.subtitle}</p>
                </div>
                {index === 0 && (
                  <span className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    Join
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">Next (Today)</p>
          <ul className="space-y-2.5">
            {managerNextItems.map((item) => (
              <li key={item.id} className="text-sm">
                <p className="text-xs text-t1-gray-400">{item.when}</p>
                <p className="truncate font-medium text-foreground">{item.title}</p>
                <p className="truncate text-xs text-t1-gray-400">{item.subtitle}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
