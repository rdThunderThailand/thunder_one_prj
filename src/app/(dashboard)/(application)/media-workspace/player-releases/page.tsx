import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { getSession } from "@/features/auth/services/get-session";
import { getPilotTarget, listPlayerReleases } from "@/features/media-workspace/player-releases/actions";
import { NewReleaseDialog } from "@/features/media-workspace/player-releases/new-release-dialog";
import { ReleasePanel } from "@/features/media-workspace/player-releases/release-panel";

export default async function PlayerReleasesPage() {
  const session = await getSession();
  if (session === "forbidden" || !session.isSuperAdmin) notFound();
  const [releases, target] = await Promise.all([listPlayerReleases(), getPilotTarget()]);

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        titleInTopbar
        title="Player releases"
        subtitle="Upload Windows Player builds and approve them for automatic update. Approved files are public."
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/media-workspace/player-releases/all-devices" className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              All devices
            </Link>
            <Link href="/media-workspace/player-releases/pilot" className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Test group
            </Link>
            <Link href="/media-workspace/player-releases/rollout" className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Rollout
            </Link>
            <NewReleaseDialog />
          </div>
        }
      />
      <ReleasePanel
        releases={releases}
        target={target}
      />
    </div>
  );
}
