import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, ClipboardIcon, MoreIcon } from "@/components/ui/icons";
import { recentReports, type RecentReportData } from "../mock-data";

const fileTypeTone: Record<RecentReportData["fileType"], string> = {
  XLSX: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  PDF: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

export function RecentReportsCard() {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">รายงานล่าสุด</h2>
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {recentReports.map((report) => (
          <li key={report.id} className="flex items-center gap-2.5 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <ClipboardIcon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{report.title}</p>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${fileTypeTone[report.fileType]}`}>
                  {report.fileType}
                </span>
              </div>
              <p className="truncate text-xs text-zinc-400">{report.createdLabel}</p>
            </div>
            <button type="button" title="Not built yet" className="shrink-0 cursor-not-allowed text-zinc-300 hover:text-zinc-400">
              <MoreIcon className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <button className="mt-3 flex items-center gap-1.5 border-t border-zinc-100 pt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:border-zinc-800 dark:text-indigo-400">
        ดูประวัติรายงานทั้งหมด
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
