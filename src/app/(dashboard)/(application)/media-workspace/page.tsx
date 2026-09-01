import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { PlusIcon, SparklesIcon } from "@/components/ui/icons";
import { OverviewDashboard } from "@/features/media-workspace/overview";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Overview"
        subtitle="Real-time status of your media ecosystem"
        actions={
          <>
            <Button variant="secondary">
              <SparklesIcon className="h-4 w-4" /> AI Assistant
            </Button>
            <Link href="/media-workspace/publications/create">
              <Button variant="primary">
                <PlusIcon className="h-4 w-4" /> Create
              </Button>
            </Link>
          </>
        }
      />
      <OverviewDashboard />
    </div>
  );
}
