import { Card } from "@/components/ui/Card";
import { LineTrendChart } from "@/components/ui/LineTrendChart";
import { ChevronDownIcon } from "@/components/ui/icons";
import { performanceTrend } from "../mock-data";

export function PerformanceTrendCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Performance Trend</h2>
        <span className="flex cursor-not-allowed items-center gap-1 text-xs text-t1-gray-400" title="Not built yet">
          This Week
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
        {performanceTrend.series.map((series) => (
          <span key={series.key} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: series.color }} />
            {series.label}
          </span>
        ))}
      </div>

      <LineTrendChart
        data={performanceTrend.data}
        series={performanceTrend.series}
        xKey={performanceTrend.xKey}
        compactYAxis
        className="h-40 w-full"
      />

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
        {performanceTrend.summary.map((stat) => (
          <div key={stat.id}>
            <p className="text-xs text-t1-gray-400">{stat.label}</p>
            <p className="text-lg font-semibold text-foreground">{stat.value}</p>
            <p className="text-xs font-medium text-t1-blue-700">
              {stat.deltaLabel} <span className="text-t1-gray-400">vs last week</span>
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
