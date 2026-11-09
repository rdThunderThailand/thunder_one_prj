import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { getSession } from "@/features/auth/services/get-session";
import { listPlayerReleases } from "@/features/media-workspace/player-releases/actions";
import { ReleasePanel } from "@/features/media-workspace/player-releases/release-panel";

export default async function PlayerReleasesPage() {
  const session = await getSession();
  if (session === "forbidden" || !session.isSuperAdmin) notFound();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Player releases"
        subtitle="Upload, download and admit Windows Player builds"
        actions={
          <Link href="/media-workspace/player-releases/pilot" className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Pilot ring
          </Link>
        }
      />
      <ReleasePanel releases={await listPlayerReleases()} />
    </div>
  );
}
