import { LightningIcon, SparklesIcon } from "@/components/ui/icons";
import { CompanyGoalsCard } from "./CompanyGoalsCard";
import { EmployeeActivityCard } from "./EmployeeActivityCard";
import { EmployeeAttentionCard } from "./EmployeeAttentionCard";
import { EmployeeInsightsCard } from "./EmployeeInsightsCard";
import { EmployeeMissionControlHeader } from "./EmployeeMissionControlHeader";
import { EmployeeScheduleCard } from "./EmployeeScheduleCard";
import { EmployeeStatTilesRow } from "./EmployeeStatTilesRow";
import { MyProgressCard } from "./MyProgressCard";
import { QuickAccessDocsCard } from "./QuickAccessDocsCard";

// The operator/employee_media ("employee") variant of the shell's shared
// Mission Control page — see config/rbac.ts's resolveShellVariant. Same
// route as the CEO and manager variants, different content: this is Ploy
// S.'s own individual view, not the team-oversight one.
export function EmployeeMissionControlPage() {
  return (
    <div className="flex flex-col gap-6">
      <EmployeeMissionControlHeader />

      <EmployeeStatTilesRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EmployeeAttentionCard />
        </div>
        <EmployeeScheduleCard />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MyProgressCard />
        <CompanyGoalsCard />
        <EmployeeInsightsCard />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EmployeeActivityCard />
        <QuickAccessDocsCard />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/5">
        <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <LightningIcon className="h-4 w-4 text-indigo-500" />
          Tip: Use the Command Palette (⌘K) to quickly find tasks, documents, or people.
        </span>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-400 dark:bg-zinc-900"
        >
          <SparklesIcon className="h-3.5 w-3.5" />
          Ask ThunderOne AI
        </span>
      </div>
    </div>
  );
}
