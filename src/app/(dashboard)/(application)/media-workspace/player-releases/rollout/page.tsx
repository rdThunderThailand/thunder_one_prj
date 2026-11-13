import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { getSession } from "@/features/auth/services/get-session";
import { getRolloutStatus, listAllDevices, listPlayerReleases } from "@/features/media-workspace/player-releases/actions";
import { RolloutPanel } from "@/features/media-workspace/player-releases/rollout-panel";

export default async function RolloutPage() {
  const session = await getSession();
  if (session === "forbidden" || !session.isSuperAdmin) notFound();
  const [status, releases, devices] = await Promise.all([getRolloutStatus(), listPlayerReleases(), listAllDevices()]);

  return (
    <div className="grid gap-6">
      <PageHeader titleInTopbar title="Rollout" subtitle="Send an approved version to every device outside the test group, a few at a time" />
      <RolloutPanel
        status={status}
        releases={releases}
        devices={devices}
      />
    </div>
  );
}
