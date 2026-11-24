// Asset Workspace reads assets through here, never through asset-list-api.ts
// directly, so screens only ever see canonical status / condition / custody.
// Server-only, same as the wrapped module; `null` still means "Core failed".
import {
  getAssetList,
  getAssetSummary,
  type AssetListQuery,
} from "@/features/asset-intelligence/assets/services/asset-list-api";
import type { AssetStatus } from "../domain/asset-status";
import {
  assetFromCore,
  statusToCore,
  summaryFromCore,
  type WorkspaceAsset,
  type WorkspaceAssetSummary,
} from "./asset-core-mapping";

export interface WorkspaceAssetQuery extends Omit<AssetListQuery, "status"> {
  status?: AssetStatus;
}

export interface WorkspaceAssetPage {
  rows: WorkspaceAsset[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export async function getWorkspaceAssets(
  token: string,
  tenantId: string,
  { status, ...query }: WorkspaceAssetQuery = {},
): Promise<WorkspaceAssetPage | null> {
  const coreStatus = status ? statusToCore(status) : undefined;
  // Core has no Disposed assets to return (CORE-GAP:status-enum).
  if (coreStatus === null) {
    return { rows: [], page: 1, pageSize: query.pageSize ?? 25, total: 0, totalPages: 0 };
  }
  const page = await getAssetList(token, tenantId, { ...query, status: coreStatus });
  return page && { ...page, rows: page.rows.map(assetFromCore) };
}

export async function getWorkspaceAssetSummary(
  token: string,
  tenantId: string,
): Promise<WorkspaceAssetSummary | null> {
  const summary = await getAssetSummary(token, tenantId);
  return summary && summaryFromCore(summary);
}
