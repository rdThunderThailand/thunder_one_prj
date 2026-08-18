import { Card } from "@/components/ui/Card";
import { DonutChart, type DonutSegment } from "@/components/ui/DonutChart";
import { StatTile } from "@/components/ui/StatTile";
import { getMockAssets } from "../services/mock-assets";
import { getMockMaintenanceAgreements } from "../mock-maintenance";

const categoryLabel: Record<string, string> = {
  laptop: "Laptop",
  printer: "Printer",
  nas: "NAS",
  media_player_device: "Media Player Device",
  other: "Other",
};

// Same validated CVD-safe categorical palette used elsewhere in this repo
// (see features/overview/mock-data.ts's own note on this).
const categoryColor: Record<string, string> = {
  laptop: "#2a78d6",
  printer: "#eb6834",
  nas: "#1baf7a",
  media_player_device: "#eda100",
  other: "#e87ba4",
};

export function AnalyticsPage() {
  const assets = getMockAssets();
  const avgHealth = Math.round(assets.reduce((sum, a) => sum + a.healthScore, 0) / assets.length);
  const totalValue = assets.reduce((sum, a) => sum + a.purchaseValue, 0);
  const expiringAgreements = getMockMaintenanceAgreements().filter(
    (ma) => ma.status !== "active",
  ).length;

  const byCategory = new Map<string, number>();
  for (const asset of assets) {
    byCategory.set(asset.category, (byCategory.get(asset.category) ?? 0) + 1);
  }
  const segments: DonutSegment[] = [...byCategory.entries()].map(([category, count]) => ({
    label: categoryLabel[category] ?? category,
    value: count,
    color: categoryColor[category] ?? "#a1a1aa",
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile label="Avg Health Score" value={String(avgHealth)} color="indigo" />
        <StatTile
          label="Total Replacement Value"
          value={`฿${totalValue.toLocaleString("en-US")}`}
        />
        <StatTile
          label="MA Needing Renewal"
          value={String(expiringAgreements)}
          color="amber"
        />
      </div>
      <Card className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start">
        <DonutChart segments={segments} size={160} strokeWidth={22} />
        <div className="flex flex-1 flex-col gap-2">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Assets by Category
          </h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            {segments.map((segment) => (
              <li key={segment.label} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-zinc-600 dark:text-zinc-300">{segment.label}</span>
                <span className="ml-auto font-medium text-zinc-900 dark:text-zinc-50">
                  {segment.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
