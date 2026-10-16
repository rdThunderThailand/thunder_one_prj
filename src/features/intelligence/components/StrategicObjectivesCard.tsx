import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ArrowRightIcon, CurrencyIcon, GaugeIcon, ShieldIcon, SparklesIcon, UsersIcon } from "@/components/ui/icons";
import { objectives, type ObjectiveData } from "../mock-data";

const iconFor: Record<ObjectiveData["icon"], React.ReactNode> = {
  gauge: <GaugeIcon />,
  shield: <ShieldIcon />,
  users: <UsersIcon />,
  currency: <CurrencyIcon />,
};

const statusColor: Record<ObjectiveData["status"], "green" | "yellow" | "red"> = {
  "On Track": "green",
  "At Risk": "yellow",
  Behind: "red",
};

const barColor: Record<ObjectiveData["status"], "emerald" | "amber" | "red"> = {
  "On Track": "emerald",
  "At Risk": "amber",
  Behind: "red",
};

export function StrategicObjectivesCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-primary" />
        <h2 className="flex-1 text-sm font-semibold text-foreground">
          Strategic Objectives Progress
        </h2>
        <span className="text-xs font-medium text-primary">View report</span>
      </div>

      <ul className="flex flex-1 flex-col divide-y divide-border">
        {objectives.map((objective) => (
          <li key={objective.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${objective.iconTone}`}
              >
                {iconFor[objective.icon]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{objective.title}</p>
                <p className="truncate text-xs text-muted-foreground">{objective.detail}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-foreground">
                {objective.percent}%
              </span>
              <Badge color={statusColor[objective.status]} variant="pill" className="shrink-0">
                {objective.status}
              </Badge>
            </div>
            <ProgressBar value={objective.percent} color={barColor[objective.status]} className="mt-2" />
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent-foreground"
      >
        View all objectives
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
