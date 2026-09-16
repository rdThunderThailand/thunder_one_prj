import { BarChart, type BarDatum } from "@/components/ui/BarChart";
import { Card } from "@/components/ui/Card";

interface TenureDistributionCardProps {
  /** Real since 2026-09-15 — bucketed from real `start_date` on the same
   *  roster fetch TodayActivityCard/PersonnelBreakdownCard use. */
  tenureDistribution: BarDatum[];
}

export function TenureDistributionCard({ tenureDistribution }: TenureDistributionCardProps) {
  const hasData = tenureDistribution.some((band) => band.count > 0);
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">การกระจายตามอายุงาน</h2>
        <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูรายงาน
        </button>
      </div>
      {hasData ? (
        <BarChart data={tenureDistribution} className="h-56 flex-1" />
      ) : (
        // All-zero (rather than a chart of five empty bars, which looks
        // broken) means no member in this tenant has a start_date set yet —
        // a real, honest state, not an error.
        <p className="flex h-56 flex-1 items-center justify-center text-center text-xs text-zinc-400">
          ยังไม่มีข้อมูลวันที่เริ่มงานของบุคลากรในองค์กรนี้
        </p>
      )}
    </Card>
  );
}
