import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { AssetsListView } from "@/features/asset-workspace/components/assets-list/AssetsListView";
import { getAssetsFilters, getAssetsList, getAssetsSummary } from "@/features/asset-workspace/services/assets-list-api";
import { readAssetListQuery, type AssetSearchParams } from "@/features/asset-workspace/services/assets-list-query";
import type { AssetsPageData } from "@/features/asset-workspace/services/assets-list-types";

export default async function AssetsPage({ searchParams }: { searchParams: Promise<AssetSearchParams> }) {
  const [session, token, params] = await Promise.all([getSession(), getAuthToken(), searchParams]);
  const parsed = readAssetListQuery(params);
  const defaults = readAssetListQuery({});
  if (!defaults.success) throw new Error("Invalid default asset query");
  const query = parsed.success ? parsed.data : defaults.data;
  const tenantId = session !== "forbidden" ? session.tenantId : null;
  let results: AssetsPageData;

  if (!token || !tenantId) {
    const denied = { ok: false as const, status: token ? 403 : 401, message: token ? "Choose an authorized organization to view assets." : "Sign in again to view assets." };
    results = { list: denied, summary: denied, filters: denied };
  } else {
    const context = { token, tenantId };
    const [list, summary, filters] = await Promise.all([
      parsed.success ? getAssetsList(context, query) : Promise.resolve({ ok: false as const, status: 400, message: "The URL contains invalid asset filters. Clear filters and try again." }),
      getAssetsSummary(context),
      getAssetsFilters(context),
    ]);
    results = { list, summary, filters };
  }

  return (
    <AssetsListView
      key={`${tenantId}:${session !== "forbidden" ? session.userId : ""}`}
      results={results}
      query={query}
    />
  );
}
