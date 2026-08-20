import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

// Named after the Asset Intelligence requirement doc's "Governance Layer"
// (ownership/permission/policy/audit), promoted to shell-level —
// docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md. Placeholder only.
export default function GovernancePage() {
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
