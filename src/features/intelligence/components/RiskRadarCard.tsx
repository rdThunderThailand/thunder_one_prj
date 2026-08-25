import { Card } from "@/components/ui/Card";
import { RiskRadarChart } from "@/components/ui/RiskRadarChart";
import { ShieldIcon } from "@/components/ui/icons";
import { riskRadar } from "../mock-data";

export function RiskRadarCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldIcon className="h-4 w-4 text-red-500" />
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Risk Radar</h2>
        </div>
        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">View all risks</span>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <RiskRadarChart data={riskRadar.axes} size={200} />
      </div>

      <div className="mb-2 flex items-center justify-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-red-500" />
          Current
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full border border-dashed border-zinc-400" />
          Last month
        </span>
      </div>

      <div className="space-y-1.5 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
        <p className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{riskRadar.highRisks} high risks</span>
        </p>
        <p className="pl-3.5 text-xs text-zinc-400">Require immediate attention</p>
        <p className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{riskRadar.mediumRisks} medium risks</span>
        </p>
        <p className="pl-3.5 text-xs text-zinc-400">Monitor closely</p>
      </div>
    </Card>
  );
}
