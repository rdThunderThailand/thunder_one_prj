import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { personnelBreakdown, totalHeadcount } from "../mock-data";

export function PersonnelBreakdownCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">สถิติบุคลากร</h2>
        <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูรายงาน
        </button>
      </div>
      <div className="flex flex-1 items-center gap-4">
        <div className="relative shrink-0" style={{ width: 128, height: 128 }}>
          <DonutChart segments={personnelBreakdown} size={128} strokeWidth={18} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{totalHeadcount}</span>
            <span className="text-[11px] text-zinc-400">คน</span>
          </div>
        </div>
        <ul className="min-w-0 flex-1 space-y-2">
          {personnelBreakdown.map((segment) => {
            const percent = ((segment.value / totalHeadcount) * 100).toFixed(1);
            return (
              <li key={segment.label} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                <span className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-300">{segment.label}</span>
                <span className="shrink-0 font-medium text-zinc-900 dark:text-zinc-50">
                  {segment.value} ({percent}%)
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}
