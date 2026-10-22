import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { ArrowRightIcon } from "@/components/ui/icons";
import { usageStatusDistribution } from "../mock-data";

export function UsageStatusCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">สถานะการใช้งานทรัพย์สิน</h2>
      <div className="flex flex-1 flex-col items-center gap-3">
        <div className="relative shrink-0">
          <DonutChart segments={usageStatusDistribution.segments} size={130} strokeWidth={16} />
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold text-foreground">
              {usageStatusDistribution.total.toLocaleString()}
            </span>
            <span className="text-[10px] text-t1-gray-400">รายการ</span>
          </div>
        </div>
        <ul className="w-full space-y-1.5 text-xs">
          {usageStatusDistribution.segments.map((segment) => (
            <li key={segment.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
                {segment.label}
              </span>
              <span className="shrink-0 font-medium text-foreground">
                {segment.percentLabel}
                <span className="ml-1 font-normal text-t1-gray-400">({segment.value})</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <button className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
        ดูรายงานละเอียด
        <ArrowRightIcon className="h-3 w-3" />
      </button>
    </Card>
  );
}
