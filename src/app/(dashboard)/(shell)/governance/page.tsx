import { PageHeader } from "@/components/layout/PageHeader";
import { resolveShellVariant, resolveRole } from "@/config/rbac";
import { getSession } from "@/features/auth/services/get-session";
import { Card } from "@/components/ui/Card";
import { EmployeeGovernancePage, ManagerGovernancePage } from "@/features/governance";

// Named after the Asset Intelligence requirement doc's "Governance Layer"
// (ownership/permission/policy/audit), promoted to shell-level —
// docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md. Not gated (viewer_auditor
// lands here — see config/rbac.ts's resolveLandingPage) — manager and employee get
// a real dashboard now; every other role still sees the original stub below.
export default async function GovernancePage() {
  const resolved = resolveRole(await getSession());
  const variant = resolveShellVariant(resolved);

  if (variant === "manager") {
    return <ManagerGovernancePage />;
  }
  if (variant === "employee") {
    return <EmployeeGovernancePage />;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Governance" subtitle="Not built yet." />
      <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Ownership, permission, policy, and audit rollups across every App. No implementation
        exists yet.
      </Card>
    </div>
  );
}
