import { BarChart } from "@/components/ui/BarChart";
import { Card } from "@/components/ui/Card";
import { tenureDistribution } from "../mock-data";

export function TenureDistributionCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">การกระจายตามอายุงาน</h2>
        <button type="button" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          ดูรายงาน
        </button>
      </div>
      <BarChart data={tenureDistribution} className="h-56 flex-1" />
    </Card>
  );
}
