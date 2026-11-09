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
      <PageHeader title="Player releases" subtitle="Upload and download Windows Player builds" />
      <ReleasePanel releases={await listPlayerReleases()} />
    </div>
  );
}
