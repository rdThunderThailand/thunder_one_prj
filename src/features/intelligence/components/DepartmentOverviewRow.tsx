import { Card } from "@/components/ui/Card";
import { Sparkline } from "@/components/ui/Sparkline";
import { CurrencyIcon, GaugeIcon, MegaphoneIcon, ShieldIcon } from "@/components/ui/icons";
import { departmentOverview, type DepartmentMetricData } from "../mock-data";

const iconFor: Record<DepartmentMetricData["icon"], React.ReactNode> = {
  megaphone: <MegaphoneIcon />,
  gauge: <GaugeIcon />,
  shield: <ShieldIcon />,
  currency: <CurrencyIcon />,
};

export function DepartmentOverviewRow() {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Department Overview</h2>
        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">View all departments</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {departmentOverview.map((dept) => (
          <div key={dept.id} className="rounded-xl border border-zinc-100 p-3 dark:border-zinc-800">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${dept.iconTone}`}
              >
                {iconFor[dept.icon]}
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{dept.name}</span>
            </div>
            <p className="mb-1 text-xs text-zinc-400">{dept.metricLabel}</p>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{dept.value}</p>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{dept.deltaLabel}</p>
              </div>
              <Sparkline data={dept.trend} className={`h-8 w-20 ${dept.trendColor}`} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
