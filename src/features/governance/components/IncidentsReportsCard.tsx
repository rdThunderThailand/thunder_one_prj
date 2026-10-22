import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, CheckCircleIcon, SearchIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { incidentStats, type IncidentStatData } from "../mock-data";

const iconFor: Record<IncidentStatData["icon"], React.ReactNode> = {
  incident: <WarningTriangleIcon />,
  investigation: <SearchIcon />,
  closed: <CheckCircleIcon />,
  critical: <WarningTriangleIcon />,
};

const tone: Record<IncidentStatData["tone"], string> = {
  red: "bg-error-muted text-error",
  amber: "bg-warning-muted text-warning",
  emerald: "bg-success-muted text-success",
  purple: "bg-in-progress-muted text-in-progress",
};

export function IncidentsReportsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Incidents &amp; Reports</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-foreground">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3">
        {incidentStats.map((stat) => (
          <div key={stat.id} className="rounded-xl border border-border p-3">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone[stat.tone]}`}>
              {iconFor[stat.icon]}
            </span>
            <p className="mt-2 text-xl font-semibold text-foreground">{stat.value}</p>
            <p className="text-xs text-t1-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>
      <button className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-sm font-medium text-primary hover:text-accent-foreground">
        View incident summary
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
