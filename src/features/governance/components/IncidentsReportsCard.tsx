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
  red: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  amber: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400",
  emerald: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-400",
  purple: "bg-purple-50 text-purple-500 dark:bg-purple-500/10 dark:text-purple-400",
};

export function IncidentsReportsCard() {
  return (
    <Card className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Incidents &amp; Reports</h2>
        <button className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </button>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3">
        {incidentStats.map((stat) => (
          <div key={stat.id} className="rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone[stat.tone]}`}>
              {iconFor[stat.icon]}
            </span>
            <p className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">{stat.value}</p>
            <p className="text-xs text-zinc-400">{stat.label}</p>
          </div>
        ))}
      </div>
      <button className="mt-3 flex items-center gap-1.5 border-t border-zinc-100 pt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:border-zinc-800 dark:text-indigo-400">
        View incident summary
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}
