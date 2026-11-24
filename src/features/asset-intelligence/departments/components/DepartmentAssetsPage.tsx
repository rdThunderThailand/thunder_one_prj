import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { AssetStatus } from "@/features/asset-intelligence/assets";
import { getDepartmentAssets, mockTeamMembers } from "../mock-data";

const badgeColor: Record<AssetStatus, "green" | "yellow" | "red"> = {
  healthy: "green",
  attention: "yellow",
  critical: "red",
};

const assigneeName = (id: string | null): string =>
  mockTeamMembers.find((m) => m.id === id)?.name ?? "Unassigned";

export function DepartmentAssetsPage() {
  const assets = getDepartmentAssets();

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Tag</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Assigned to</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td className="px-4 py-3 font-medium text-foreground">{asset.tag}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {asset.model ?? asset.category}
              </td>
              <td className="px-4 py-3">
                <Badge color={badgeColor[asset.status]} variant="pill">
                  {asset.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {assigneeName(asset.assigneeId)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
