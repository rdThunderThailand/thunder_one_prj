import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { personnelRetentionRate, personnelStatTiles } from "../mock-data";

interface PersonnelStatTilesRowProps {
  /** Core's real member count (PersonnelPage's `totalCount` prop) — the one
   *  real tile among these; the other 4 have no Core aggregate endpoint yet
   *  and stay mock (see mock-data.ts's header comment). */
  totalCount: number;
}

export function PersonnelStatTilesRow({ totalCount }: PersonnelStatTilesRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <Card className="flex flex-col gap-1 p-4">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">พนักงานทั้งหมด</p>
        <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{totalCount}</span>
        <p className="text-xs text-zinc-400">คน</p>
      </Card>

      {personnelStatTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          <span className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{tile.value}</span>
          <p className="text-xs text-zinc-400">{tile.sublabel}</p>
        </Card>
      ))}

      <Card className="flex items-center gap-3 p-4">
        <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
          <DonutChart
            size={56}
            strokeWidth={7}
            segments={[
              { label: "อัตราการคงอยู่", value: personnelRetentionRate, color: "#6366f1" },
              { label: "Remaining", value: 100 - personnelRetentionRate, color: "#e4e4e7" },
            ]}
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-zinc-900 dark:text-zinc-50">
            {personnelRetentionRate}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">อัตราการคงอยู่</p>
          <p className="text-xs text-zinc-400">เทียบกับ 90%</p>
        </div>
      </Card>
    </div>
  );
}
