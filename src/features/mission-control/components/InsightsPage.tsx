import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Sparkline } from "@/components/ui/Sparkline";
import { getMockAssets, mockDepartments } from "@/features/asset-intelligence/assets";
import { statCards } from "../mock-data";

function CriticalTrendCard() {
  const critical = statCards.find((s) => s.id === "critical");
  if (!critical) return null;

  return (
    <Card className="p-4">
      <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Critical Assets — 12 Month Trend
      </h2>
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        Flat, not climbing — no systemic issue, per-asset decisions are enough for now.
      </p>
      <Sparkline data={critical.trend} className="h-16 w-full text-blue-500" />
    </Card>
  );
}

function DepartmentBenchmarkCard() {
  const assets = getMockAssets();

  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        Department Benchmark — Avg Health Score
      </h2>
      <div className="flex flex-col gap-3">
        {mockDepartments.map((dept) => {
          const deptAssets = assets.filter((a) => a.departmentId === dept.id);
          const avgHealth = deptAssets.length
            ? Math.round(deptAssets.reduce((sum, a) => sum + a.healthScore, 0) / deptAssets.length)
            : 0;
          return (
            <div key={dept.id}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">{dept.name}</span>
                <span className="text-zinc-400">
                  {avgHealth}% · {deptAssets.length} asset{deptAssets.length === 1 ? "" : "s"}
                </span>
              </div>
              <ProgressBar value={avgHealth} color={avgHealth < 60 ? "red" : "emerald"} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// CEO-05a: trends and cross-department benchmarks -- distinct from Reports
// (a flat rollup table), per the requirement doc's AC ("รองรับ export
// PDF/Excel, filter ตามช่วงเวลา/แผนก") though neither export nor filtering is
// built (no backend, same as every other role's Reports/Analytics page).
export function InsightsPage() {
  return (
    <div className="flex flex-col gap-4">
      <CriticalTrendCard />
      <DepartmentBenchmarkCard />
    </div>
  );
}
