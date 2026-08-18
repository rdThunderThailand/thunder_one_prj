import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getMockAssets } from "../services/mock-assets";
import type { AssetStatus } from "../types";

const badgeColor: Record<AssetStatus, "green" | "yellow" | "red"> = {
  healthy: "green",
  attention: "yellow",
  critical: "red",
};

const categoryLabel: Record<string, string> = {
  laptop: "Laptop",
  printer: "Printer",
  nas: "NAS",
  media_player_device: "Media Player Device",
  other: "Other",
};

export function AssetsListPage() {
  const assets = getMockAssets();

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">Tag</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Health</th>
            <th className="px-4 py-3 font-medium">Location</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{asset.tag}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                {categoryLabel[asset.category] ?? asset.category}
              </td>
              <td className="px-4 py-3">
                <Badge color={badgeColor[asset.status]} variant="pill">
                  {asset.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{asset.healthScore}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                {asset.locationId ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
