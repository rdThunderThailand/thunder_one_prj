import { Card } from "@/components/ui/Card";
import { RiskRadarChart } from "@/components/ui/RiskRadarChart";
import { ShieldIcon } from "@/components/ui/icons";
import { riskRadar } from "../mock-data";

export function RiskRadarCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldIcon className="h-4 w-4 text-error" />
          <h2 className="text-sm font-semibold text-foreground">Risk Radar</h2>
        </div>
        <span className="text-xs font-medium text-primary">View all risks</span>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <RiskRadarChart data={riskRadar.axes} size={200} />
      </div>

      <div className="mb-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full bg-error" />
          Current
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-3 rounded-full border border-dashed border-t1-gray-400" />
          Last month
        </span>
      </div>

      <div className="space-y-1.5 border-t border-border pt-3 text-sm">
        <p className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-error" />
          <span className="font-medium text-foreground">{riskRadar.highRisks} high risks</span>
        </p>
        <p className="pl-3.5 text-xs text-t1-gray-400">Require immediate attention</p>
        <p className="flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-warning" />
          <span className="font-medium text-foreground">{riskRadar.mediumRisks} medium risks</span>
        </p>
        <p className="pl-3.5 text-xs text-t1-gray-400">Monitor closely</p>
      </div>
    </Card>
  );
}
