import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";

// Named after the Asset Intelligence requirement doc's "Intelligence Layer"
// (risk/insight/recommendation), promoted to shell-level —
// docs/adr/0033-thunder-one-shell-launcher-not-dropdown.md. Placeholder only.
export default function IntelligencePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Intelligence" subtitle="Not built yet." />
      <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Risk, insight, and recommendation rollups across every App. No implementation exists yet.
      </Card>
    </div>
  );
}
