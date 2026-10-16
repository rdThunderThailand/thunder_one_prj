import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ClipboardIcon, MoreIcon } from "@/components/ui/icons";
import { recentReports, type RecentReportData } from "../mock-data";

const fileTypeTone: Record<RecentReportData["fileType"], string> = {
  XLSX: "bg-success-muted text-t1-green-700",
  PDF: "bg-error-muted text-t1-red-700",
};

export function RecentReportsCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">รายงานล่าสุด</h2>
      <ul className="flex flex-col divide-y divide-border">
        {recentReports.map((report) => (
          <li key={report.id} className="flex items-center gap-2.5 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-t1-gray-400">
              <ClipboardIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-foreground">{report.title}</p>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${fileTypeTone[report.fileType]}`}>
                  {report.fileType}
                </span>
              </div>
              <p className="truncate text-xs text-t1-gray-400">{report.createdLabel}</p>
            </div>
            <button type="button" title="Not built yet" className="shrink-0 cursor-not-allowed text-t1-gray-400 hover:text-muted-foreground">
              <MoreIcon className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-sm font-medium text-primary hover:text-accent-foreground">
        ดูประวัติรายงานทั้งหมด
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
