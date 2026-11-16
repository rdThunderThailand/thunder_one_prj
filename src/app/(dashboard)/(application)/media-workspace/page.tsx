import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ChevronDownIcon, PlusIcon, SparklesIcon } from "@/components/ui/icons";
import { getSession } from "@/features/auth/services/get-session";
import { OverviewDashboard } from "@/features/media-workspace/overview";

export default async function OverviewPage() {
  const session = await getSession();
  const isSuperAdmin = session !== "forbidden" && session.isSuperAdmin;
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Overview" subtitle="Real-time status of your media ecosystem" titleInTopbar />
      <OverviewDashboard
        actions={
          <>
            {isSuperAdmin && (
              <Link href="/media-workspace/player-releases" className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Player releases
              </Link>
            )}
            <button
              type="button"
              disabled
              title="Coming soon"
              className="hidden h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-muted-foreground opacity-60 sm:inline-flex"
            >
              <SparklesIcon className="h-3.5 w-3.5 text-primary" />
              AI assistant
            </button>
            <Link
              href="/media-workspace/program/create"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Create
              <ChevronDownIcon className="h-3 w-3" />
            </Link>
          </>
        }
      />
    </div>
  );
}
