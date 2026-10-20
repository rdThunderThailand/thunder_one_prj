import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ArrowRightIcon } from "@/components/ui/icons";
import { assetAllocationSummary, assetCategoryBreakdown } from "../mock-data";

export function AssetAllocationCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">การจัดสรรทรัพย์สิน</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
          ดูทั้งหมด
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xl font-semibold text-foreground">
            {assetAllocationSummary.allocated.value.toLocaleString()}
          </p>
          <p className="text-xs text-t1-gray-400">จัดสรรแล้ว</p>
          <p className="text-xs text-t1-gray-400">{assetAllocationSummary.allocated.percentLabel}</p>
        </div>
        <div>
          <p className="text-xl font-semibold text-foreground">
            {assetAllocationSummary.unallocated.value.toLocaleString()}
          </p>
          <p className="text-xs text-t1-gray-400">ยังไม่ได้จัดสรร</p>
          <p className="text-xs text-t1-gray-400">{assetAllocationSummary.unallocated.percentLabel}</p>
        </div>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-t1-gray-400">แยกตามประเภททรัพย์สิน</p>
      <ul className="flex flex-1 flex-col justify-center gap-2.5">
        {assetCategoryBreakdown.map((row) => (
          <li key={row.id}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="text-t1-gray-400">
                {row.allocated.toLocaleString()}/{row.total.toLocaleString()}
                <span className="ml-1 font-medium text-muted-foreground">{row.percent}%</span>
              </span>
            </div>
            <ProgressBar value={row.percent} color="indigo" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
