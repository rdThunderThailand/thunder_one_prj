import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { assetStatusOverview } from "../mock-data";

export function AssetStatusCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">สถานะทรัพย์สิน</h2>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:flex-row sm:items-center sm:justify-start">
        <div className="relative shrink-0">
          <DonutChart segments={assetStatusOverview.segments} size={140} strokeWidth={18} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {assetStatusOverview.total.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-400">รายการ</span>
          </div>
        </div>
        <ul className="w-full flex-1 space-y-2 text-sm">
          {assetStatusOverview.segments.map((segment) => (
            <li key={segment.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                {segment.label}
              </span>
              <span className="shrink-0 font-medium text-zinc-900 dark:text-zinc-50">
                {segment.value.toLocaleString()}
                <span className="ml-1 text-xs font-normal text-zinc-400">({segment.percentLabel})</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
