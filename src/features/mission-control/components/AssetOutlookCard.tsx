import { Card } from "@/components/ui/Card";
import { assetOutlook } from "../mock-data";

// CEO-02.
export function AssetOutlookCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Asset Outlook</h2>
      <ul className="flex flex-col gap-2.5 text-sm">
        <li className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Warranty exposure</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {assetOutlook.warrantyExposure}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Critical asset risks</span>
          <span className="font-medium text-red-500">{assetOutlook.criticalAssetRisks}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Maintenance cost</span>
          <span className="font-medium text-amber-500">
            ▲ {assetOutlook.maintenanceCostTrend}
          </span>
        </li>
        <li className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Major incidents</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {assetOutlook.majorIncidents}
          </span>
        </li>
      </ul>
    </Card>
  );
}
