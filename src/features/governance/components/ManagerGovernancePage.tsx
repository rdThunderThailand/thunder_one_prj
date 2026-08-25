import { ArrowRightIcon, ShieldIcon } from "@/components/ui/icons";
import { AuditAssessmentCard } from "./AuditAssessmentCard";
import { GovernanceOverviewCard } from "./GovernanceOverviewCard";
import { GovernanceStatTiles } from "./GovernanceStatTiles";
import { IncidentsReportsCard } from "./IncidentsReportsCard";
import { ManagerGovernanceHeader } from "./ManagerGovernanceHeader";
import { MyGovernanceTasksCard } from "./MyGovernanceTasksCard";
import { PendingApprovalsCard } from "./PendingApprovalsCard";
import { PoliciesTableCard } from "./PoliciesTableCard";
import { PolicyUpdatesCard } from "./PolicyUpdatesCard";
import { QuickLinksCard } from "./QuickLinksCard";
import { TrainingAwarenessCard } from "./TrainingAwarenessCard";

// The department_admin / manager_it_asset ("manager") variant of the
// shell's Governance page — config/rbac.ts's resolveShellVariant. No CEO
// variant exists yet; every other role still sees the original "Not built
// yet" stub (governance/page.tsx).
export function ManagerGovernancePage() {
  return (
    <div className="flex flex-col gap-6">
      <ManagerGovernanceHeader />

      <GovernanceStatTiles />

      <GovernanceOverviewCard />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PoliciesTableCard />
            <PendingApprovalsCard />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TrainingAwarenessCard />
            <IncidentsReportsCard />
            <AuditAssessmentCard />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <MyGovernanceTasksCard />
          <PolicyUpdatesCard />
          <QuickLinksCard />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/5">
        <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <ShieldIcon className="h-4 w-4 text-indigo-500" />
          Tip: Good governance starts with clear policy, regular audits, and an organization-wide culture of compliance.
        </span>
        <span
          title="Not built yet"
          className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-400 dark:bg-zinc-900"
        >
          Report an Issue
          <ArrowRightIcon className="h-3.5 w-3.5 -rotate-45" />
        </span>
      </div>
    </div>
  );
}
