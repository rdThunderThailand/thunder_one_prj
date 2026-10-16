import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ChevronRightIcon, ClipboardIcon } from "@/components/ui/icons";
import { popularReports } from "../mock-data";

export function PopularReportsCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">รายงานยอดนิยม</h2>
      <ul className="flex flex-col divide-y divide-border">
        {popularReports.map((report) => (
          <li key={report.id}>
            <div
              title="Not built yet"
              className="flex cursor-not-allowed items-center gap-2.5 py-2.5 text-sm text-muted-foreground"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                <ClipboardIcon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{report.title}</p>
                <p className="truncate text-xs text-t1-gray-400">{report.subtitle}</p>
              </div>
              <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-t1-gray-400" />
            </div>
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-sm font-medium text-primary hover:text-primary">
        ดูรายงานทั้งหมด
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
