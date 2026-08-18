import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/layout/PageHeader";

// Employee/User — "My Assets" (requirement doc §4.5). Per the repo mapping doc §5
// this is meant to become a scoped view within features/ai-assets, not a separate
// feature — placeholder route until that view exists.
export default function MyAssetsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Assets" subtitle="Equipment currently assigned to you." />
      <Card className="p-6 text-sm text-zinc-500 dark:text-zinc-400">
        Not built yet — see requirement doc §4.5 (Employee/User).
      </Card>
    </div>
  );
}
