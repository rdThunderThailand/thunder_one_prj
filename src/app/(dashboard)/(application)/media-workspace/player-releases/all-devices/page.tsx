import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { getSession } from "@/features/auth/services/get-session";
import { getPilotTarget, listAllDevices, listPlayerReleases } from "@/features/media-workspace/player-releases/actions";
import { AllDevicesPanel } from "@/features/media-workspace/player-releases/all-devices-panel";

export default async function AllDevicesPage() {
  const session = await getSession();
  if (session === "forbidden" || !session.isSuperAdmin) notFound();

  const [devices, target, releases] = await Promise.all([listAllDevices(), getPilotTarget(), listPlayerReleases()]);
  const releaseId = "data" in target ? target.data?.release_id ?? null : null;
  const offered = releaseId && "data" in releases ? releases.data.find((release) => release.admitted?.id === releaseId) : undefined;

  return (
    <div className="grid gap-6">
      <PageHeader
        titleInTopbar
        title="All devices"
        subtitle="Every Media device and the Player version it is running"
        actions={
          <Link href="/media-workspace/player-releases/pilot" className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Update group
          </Link>
        }
      />
      <AllDevicesPanel devices={devices} offerLabel={offered ? `${offered.display_name} · ${offered.version}` : null} />
    </div>
  );
}
