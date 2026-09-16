import { ArrowRightIcon, ShieldIcon } from "@/components/ui/icons";
import { EmployeeApprovalsCard } from "./EmployeeApprovalsCard";
import { EmployeeExceptionsCard } from "./EmployeeExceptionsCard";
import { EmployeeGovernanceHeader } from "./EmployeeGovernanceHeader";
import { EmployeeGovernanceStatTiles } from "./EmployeeGovernanceStatTiles";
import { EmployeeGovernanceTasksCard } from "./EmployeeGovernanceTasksCard";
import { EmployeePolicyUpdatesCard } from "./EmployeePolicyUpdatesCard";
import { GovernanceMonitoringRow } from "./GovernanceMonitoringRow";
import { OrganizationInfoCard } from "./OrganizationInfoCard";
import { PolicyFrameworkCard } from "./PolicyFrameworkCard";
import { QuickLinksCard } from "./QuickLinksCard";

// The operator / employee_media ("employee") variant of the shell's
// Governance page — config/rbac.ts's resolveShellVariant. A personal
// compliance view (my tasks, my approvals, policy framework) rather than
// the manager variant's org-wide policy-table/audit shape
// (./ManagerGovernancePage.tsx). `QuickLinksCard` is reused as-is from the
// manager variant — generic org-wide links, not persona-specific.
export function EmployeeGovernancePage() {
  return (
    <div className="flex flex-col gap-6">
      <EmployeeGovernanceHeader />

      <EmployeeGovernanceStatTiles />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <PolicyFrameworkCard />
        </div>
        <EmployeeGovernanceTasksCard />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <GovernanceMonitoringRow />
        </div>
        <EmployeePolicyUpdatesCard />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <EmployeeApprovalsCard />
        </div>
        <div className="lg:col-span-2">
          <EmployeeExceptionsCard />
        </div>
        <OrganizationInfoCard />
        <QuickLinksCard />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/5">
        <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
          <ShieldIcon className="h-4 w-4 text-indigo-500" />
          Tip: Governance is everyone&apos;s responsibility. If you see something that doesn&apos;t look right, report it.
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
