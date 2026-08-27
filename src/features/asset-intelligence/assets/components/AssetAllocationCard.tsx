import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ArrowRightIcon } from "@/components/ui/icons";
import { assetAllocationSummary, assetCategoryBreakdown } from "../mock-data";

export function AssetAllocationCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">การจัดสรรทรัพย์สิน</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {assetAllocationSummary.allocated.value.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400">จัดสรรแล้ว</p>
          <p className="text-xs text-zinc-400">{assetAllocationSummary.allocated.percentLabel}</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {assetAllocationSummary.unallocated.value.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-400">ยังไม่ได้จัดสรร</p>
          <p className="text-xs text-zinc-400">{assetAllocationSummary.unallocated.percentLabel}</p>
        </div>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">แยกตามประเภททรัพย์สิน</p>
      <ul className="flex flex-1 flex-col justify-center gap-2.5">
        {assetCategoryBreakdown.map((row) => (
          <li key={row.id}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-300">{row.label}</span>
              <span className="text-zinc-400">
                {row.allocated.toLocaleString()}/{row.total.toLocaleString()}
                <span className="ml-1 font-medium text-zinc-600 dark:text-zinc-300">{row.percent}%</span>
              </span>
            </div>
            <ProgressBar value={row.percent} color="indigo" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
