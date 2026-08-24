import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

// Cross-app "what's assigned to me" rollup. Not a mandated aggregation
// pattern — no data-sourcing design exists yet —
// docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md, consequence #11.
export default function MyWorkPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Work" subtitle="Not built yet." />
      <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Will roll up work assigned to the current user across every App (e.g. ThunderCare work
        orders). No cross-App data source exists yet.
      </Card>
    </div>
  );
}
