import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { getSession } from "@/features/auth/services/get-session";
import { getPilotTarget, listPilotMembers, listPlayerReleases } from "@/features/media-workspace/player-releases/actions";
import { PilotPanel } from "@/features/media-workspace/player-releases/pilot-panel";

export default async function PilotRingPage({ searchParams }: { searchParams: Promise<{ release?: string }> }) {
  const session = await getSession();
  if (session === "forbidden" || !session.isSuperAdmin) notFound();
  const [members, target, releases, { release }] = await Promise.all([listPilotMembers(), getPilotTarget(), listPlayerReleases(), searchParams]);

  return (
    <div className="grid gap-6">
      <PageHeader titleInTopbar title="Test group" subtitle="Devices that auto update first, before any wider rollout" />
      <PilotPanel
        members={members}
        target={target}
        releases={releases}
        preselected={release}
      />
    </div>
  );
}
