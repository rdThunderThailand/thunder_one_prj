import { AllAssetsPage } from "@/features/asset-intelligence/assets";
import { getAssetFilters, getAssetList, getAssetSummary, ASSET_LIST_STATUSES, type AssetListStatus } from "@/features/asset-intelligence/assets/services/asset-list-api";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function asStatus(value: string | undefined): AssetListStatus | undefined {
  return ASSET_LIST_STATUSES.includes(value as AssetListStatus) ? (value as AssetListStatus) : undefined;
}

interface AssetIntelligenceAllAssetsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AssetIntelligenceAllAssetsPage({ searchParams }: AssetIntelligenceAllAssetsPageProps) {
  const sp = await searchParams;
  const page = Number(firstParam(sp.page)) || 1;
  const category = firstParam(sp.category);
  const status = asStatus(firstParam(sp.status));
  const building = firstParam(sp.building);
  const owner = firstParam(sp.owner);

  const session = await getSession();
  const token = await getAuthToken();
  const tenantId = session !== "forbidden" ? session.tenantId : null;

  const [list, summary, filters] =
    token && tenantId
      ? await Promise.all([
          getAssetList(token, tenantId, { page, pageSize: 25, category, status, building, owner }),
          getAssetSummary(token, tenantId),
          getAssetFilters(token, tenantId),
        ])
      : [null, null, null];

  return (
    <AllAssetsPage
      list={list}
      summary={summary}
      filters={filters}
      filterQuery={{ category, status, building, owner }}
    />
  );
}
