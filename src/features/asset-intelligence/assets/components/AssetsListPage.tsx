"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CheckCircleIcon } from "@/components/ui/icons";
import { getMockAssets } from "../services/mock-assets";
import { mockDepartments } from "../mock-reference-data";
import type { Asset, AssetStatus } from "../types";

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

const departmentName = (id: string | null): string =>
  mockDepartments.find((d) => d.id === id)?.name ?? "—";

// AM-04: pass an unassigned asset to a department. Real, working local state
// (select a department, confirm) -- doesn't write departmentId back to
// mock-assets.ts, so it won't show up on that department's own pages (see
// asset-intelligence/issues/components/ReportProblemForm.tsx's comment for why this sprint
// keeps such actions client-local).
function DepartmentCell({ asset }: { asset: Asset }) {
  const [passedTo, setPassedTo] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState(mockDepartments[0]?.id ?? "");

  if (asset.departmentId) {
    return <span>{departmentName(asset.departmentId)}</span>;
  }

  if (passedTo) {
    return (
      <span className="flex items-center gap-1.5 text-t1-green-700">
        <CheckCircleIcon className="h-4 w-4" /> Passed to {passedTo}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={departmentId}
        onChange={(e) => setDepartmentId(e.target.value)}
        className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
      >
        {mockDepartments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          const dept = mockDepartments.find((d) => d.id === departmentId);
          setPassedTo(dept?.name ?? departmentId);
        }}
        className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Pass to Department
      </button>
    </div>
  );
}

export function AssetsListPage() {
  const assets = getMockAssets();

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Tag</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Health</th>
            <th className="px-4 py-3 font-medium">Department</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td className="px-4 py-3 font-medium text-foreground">{asset.tag}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {categoryLabel[asset.category] ?? asset.category}
              </td>
              <td className="px-4 py-3">
                <Badge color={badgeColor[asset.status]} variant="pill">
                  {asset.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{asset.healthScore}</td>
              <td className="px-4 py-3 text-muted-foreground">
                <DepartmentCell asset={asset} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
