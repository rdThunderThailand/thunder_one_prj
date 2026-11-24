import { BarChart } from "@/components/ui/BarChart";
import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { positionFillRate, positionLevelBars, positionStatTiles } from "../mock-data";

// 3 plain tiles + a fill-rate donut ring (reusing DonutChart's 2-segment
// score/remainder pattern, same as people/overview's Workforce Health
// tile) + a small level-breakdown bar chart, matching the mockup's header
// row. All mock — see mock-data.ts's header comment.
export function PositionStatTilesRow() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-3 lg:grid-cols-3">
        {positionStatTiles.map((tile) => (
          <Card key={tile.id} className="flex flex-col gap-1 p-4">
            <p className="text-xs text-muted-foreground">{tile.label}</p>
            <span className="text-2xl font-semibold text-foreground">{tile.value}</span>
            <p className="text-xs text-t1-gray-400">{tile.sublabel}</p>
          </Card>
        ))}
      </div>

      <Card className="flex items-center gap-3 p-4">
        <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
          <DonutChart
            size={64}
            strokeWidth={8}
            segments={[
              { label: "อัตราการครองตำแหน่ง", value: positionFillRate, color: "var(--color-primary)" },
              { label: "ตำแหน่งว่าง", value: 100 - positionFillRate, color: "var(--color-border)" },
            ]}
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
            {positionFillRate}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">อัตราการครองตำแหน่ง</p>
          <p className="text-xs text-t1-gray-400">จากตำแหน่งงานทั้งหมด</p>
        </div>
      </Card>

      <Card className="flex flex-col p-4 lg:col-span-1">
        <p className="mb-1 text-xs text-muted-foreground">ระดับตำแหน่งงาน</p>
        <BarChart data={positionLevelBars} className="h-24 flex-1" />
      </Card>
    </div>
  );
}
