import { SessionOverview } from "@/features/asset-workspace/components/inventory/SessionOverview";
import { ErrorState } from "@/features/asset-workspace/components/states/ErrorState";
import {
  getInventoryActivity,
  getInventoryOwners,
  getInventorySession,
  getInventorySessionAssets,
} from "@/features/asset-workspace/services/asset-inventory-api";

// Session Overview. The layout already handled not-found / Draft; `getInventorySession` is cached per request.
export default async function SessionOverviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  // pageSize 1: only the by-location / by-category totals are used here.
  const [session, assets, activity, owners] = await Promise.all([
    getInventorySession(sessionId),
    getInventorySessionAssets(sessionId, { pageSize: "1" }),
    getInventoryActivity(sessionId, { pageSize: "5" }),
    getInventoryOwners(),
  ]);
  if (!session || session === "not-found") return <ErrorState />;
  return (
    <SessionOverview
      session={session}
      assets={assets}
      activity={activity}
      owners={owners}
    />
  );
}
