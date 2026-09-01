import { Card } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import { statTiles, workforceHealth, type StatTileColor } from "../mock-data";

const valueColor: Record<StatTileColor, string> = {
  indigo: "text-indigo-600 dark:text-indigo-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  blue: "text-blue-600 dark:text-blue-400",
  red: "text-red-600 dark:text-red-400",
};

const deltaColor: Record<StatTileColor, string> = {
  indigo: "text-zinc-400",
  emerald: "text-emerald-500",
  amber: "text-zinc-400",
  blue: "text-zinc-400",
  red: "text-red-500",
};

// Six tiles across — five plain metrics plus a Workforce Health ring, matching
// the mockup exactly. The ring reuses DonutChart (2 segments: score/remainder)
// rather than a one-off SVG, same "no second chart primitive for the same
// shape" discipline as the rest of this codebase's chart usage.
export function StatTilesRow() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {statTiles.map((tile) => (
        <Card key={tile.id} className="flex flex-col gap-1 p-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{tile.label}</p>
          <span className={`text-2xl font-semibold ${valueColor[tile.color]}`}>{tile.value}</span>
          {tile.sublabel && <p className="text-xs text-zinc-400">{tile.sublabel}</p>}
          {tile.deltaLabel && <p className={`text-xs font-medium ${deltaColor[tile.color]}`}>{tile.deltaLabel}</p>}
        </Card>
      ))}

      <Card className="flex items-center gap-3 p-4">
        <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
          <DonutChart
            size={56}
            strokeWidth={7}
            segments={[
              { label: "Workforce Health", value: workforceHealth.score, color: "#6366f1" },
              { label: "Remaining", value: 100 - workforceHealth.score, color: "#e4e4e7" },
            ]}
          />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-zinc-900 dark:text-zinc-50">
            {workforceHealth.score}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Workforce Health</p>
          <p className="text-xs font-medium text-emerald-500">{workforceHealth.deltaLabel}</p>
          <p className="truncate text-[11px] text-zinc-400">{workforceHealth.previousLabel}</p>
        </div>
      </Card>
    </div>
  );
}
