import { Card } from "@/components/ui/Card";
import { LineTrendChart } from "@/components/ui/LineTrendChart";
import { purchaseTrend } from "../mock-data";

export function PurchaseTrendCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">แนวโน้มการซื้อทรัพย์สิน</h2>
        <p className="text-xs text-zinc-400">มูลค่า (THB)</p>
      </div>

      <div className="mb-2 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        {purchaseTrend.series.map((series) => (
          <span key={series.key} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: series.color }} />
            {series.label}
          </span>
        ))}
      </div>

      <LineTrendChart
        data={purchaseTrend.data}
        series={purchaseTrend.series}
        xKey={purchaseTrend.xKey}
        compactYAxis
        className="h-48 w-full"
      />

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        {purchaseTrend.summary.map((stat) => (
          <div key={stat.id}>
            <p className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: purchaseTrend.series.find((s) => s.key === stat.id)?.color }} />
              {stat.label}
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              รวม {stat.value}
              {stat.deltaLabel && <span className="ml-1.5 text-xs font-medium text-emerald-500">▲ {stat.deltaLabel.replace("▲ ", "")}</span>}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
