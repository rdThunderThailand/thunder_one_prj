import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { MoreIcon, PlusIcon, SparklesIcon } from "@/components/ui/icons";
import { OverviewDashboard } from "@/features/media-workspace/overview";

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Media Workspace"
        subtitle="ศูนย์กลางการจัดการและเผยแพร่สื่อของคุณ"
        actions={
          <>
            <Button variant="secondary">
              <SparklesIcon className="h-4 w-4" /> AI Assistant
            </Button>
            <Link href="/media-workspace/publications/create">
              <Button variant="primary">
                <PlusIcon className="h-4 w-4" /> Create Publication
              </Button>
            </Link>
            <button
              className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
              aria-label="More options"
            >
              <MoreIcon />
            </button>
          </>
        }
      />
      <OverviewDashboard />
    </div>
  );
}
