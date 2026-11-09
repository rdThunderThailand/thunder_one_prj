import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { getSession } from "@/features/auth/services/get-session";
import { getPilotTarget, listPilotMembers, listPlayerReleases } from "@/features/media-workspace/player-releases/actions";
import { PilotPanel } from "@/features/media-workspace/player-releases/pilot-panel";

export default async function PilotRingPage() {
  const session = await getSession();
  if (session === "forbidden" || !session.isSuperAdmin) notFound();
  const [members, target, releases] = await Promise.all([listPilotMembers(), getPilotTarget(), listPlayerReleases()]);

  return (
    <div className="grid gap-6">
      <PageHeader title="Pilot ring" subtitle="Devices that auto update to the pilot target first" />
      <PilotPanel
        members={members}
        target={target}
        releases={releases}
      />
    </div>
  );
}
