import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { getMockIssues, ResolvedIssuesList } from "@/features/ai-issues";
import { getMockAssets } from "../services/mock-assets";

const categoryLabel: Record<string, string> = {
  laptop: "Laptop",
  printer: "Printer",
  nas: "NAS",
  media_player_device: "Media Player Device",
  other: "Other",
};

// A read-only, org-wide summary (requirement doc AM-08) -- no export, same
// as every other role's un-exportable Reports page this sprint.
export function ReportsPage() {
  const assets = getMockAssets();
  const resolvedIssues = getMockIssues().filter((i) => i.status === "resolved");
  const totalValue = assets.reduce((sum, a) => sum + a.purchaseValue, 0);
  const byCategory = new Map<string, { count: number; value: number }>();
  for (const asset of assets) {
    const entry = byCategory.get(asset.category) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += asset.purchaseValue;
    byCategory.set(asset.category, entry);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile label="Total Assets" value={String(assets.length)} />
        <StatTile label="Total Value" value={`฿${totalValue.toLocaleString("en-US")}`} color="indigo" />
        <StatTile
          label="Unassigned to Department"
          value={String(assets.filter((a) => !a.departmentId).length)}
          color="amber"
        />
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Count</th>
              <th className="px-4 py-3 font-medium">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {[...byCategory.entries()].map(([category, entry]) => (
              <tr key={category}>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  {categoryLabel[category] ?? category}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{entry.count}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  ฿{entry.value.toLocaleString("en-US")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <ResolvedIssuesList issues={resolvedIssues} />
    </div>
  );
}
