import { OverviewPage, type OverviewData } from "@/features/asset-workspace/components/overview/OverviewPage";
import {
  getCategoryCounts,
  getExpiringWarranties,
  getInMaintenance,
  getLocationCounts,
  getRecentActivity,
  getStatusCounts,
} from "@/features/asset-workspace/services/asset-overview-api";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

// Overview — every widget loads in parallel and fails on its own (docs/adr/0097 route `/`).
export default async function AssetWorkspaceOverviewPage() {
  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  const [statusCounts, categories, locations, warranties, maintenance, activity] =
    token && tenantId
      ? await Promise.all([
          getStatusCounts(token, tenantId),
          getCategoryCounts(token, tenantId),
          getLocationCounts(token, tenantId),
          getExpiringWarranties(token, tenantId),
          getInMaintenance(token, tenantId),
          getRecentActivity(token, tenantId),
        ])
      : [null, null, null, null, null, null];

  const data: OverviewData = { statusCounts, categories, locations, warranties, maintenance, activity };
  return <OverviewPage data={data} />;
}
