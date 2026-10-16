import { Card } from "@/components/ui/Card";
import { LineTrendChart } from "@/components/ui/LineTrendChart";
import { purchaseTrend } from "../mock-data";

export function PurchaseTrendCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">แนวโน้มการซื้อทรัพย์สิน</h2>
        <p className="text-xs text-t1-gray-400">มูลค่า (THB)</p>
      </div>

      <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
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

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
        {purchaseTrend.summary.map((stat) => (
          <div key={stat.id}>
            <p className="flex items-center gap-1.5 text-xs text-t1-gray-400">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: purchaseTrend.series.find((s) => s.key === stat.id)?.color }} />
              {stat.label}
            </p>
            <p className="text-sm font-semibold text-foreground">
              รวม {stat.value}
              {stat.deltaLabel && <span className="ml-1.5 text-xs font-medium text-success">▲ {stat.deltaLabel.replace("▲ ", "")}</span>}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
