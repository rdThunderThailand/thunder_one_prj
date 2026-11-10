import type { z } from "zod";
import { requestAssetWorkspace, AssetWorkspaceRequestError } from "./asset-workspace-api";
import type { AssetReadResult } from "./assets-list-types";
import {
  assetActivityPageSchema, assetDetailSchema, assetFilesSchema, assetWarrantiesSchema,
  type AssetActivityPage, type AssetDetail, type AssetFiles, type AssetWarranty,
} from "./asset-profile-contract";

export const ACTIVITY_PAGE_SIZE = 20;
export type ProfileReadResult<T> = AssetReadResult<T> & { code?: string };

async function readProfile<T>(context: string, path: string, schema: z.ZodType<T>, signal: AbortSignal): Promise<ProfileReadResult<T>> {
  try {
    const parsed = schema.safeParse(await requestAssetWorkspace("GET", path, undefined, { context, signal, timeout: 20000 }));
    return parsed.success ? { ok: true, data: parsed.data }
      : { ok: false, status: 502, code: "CONTRACT_MISMATCH", message: "The asset service returned an unexpected response. Try again." };
  } catch (error) {
    if (signal.aborted) throw error;
    const status = error instanceof AssetWorkspaceRequestError ? error.status || 503 : 503;
    const code = error instanceof AssetWorkspaceRequestError ? error.code : "UNREACHABLE";
    // Another organization's asset is a 404 too, so "not found" never confirms that it exists.
    const message = code === "NOT_FOUND" ? "This asset doesn't exist in your organization, or it is no longer available."
      : code === "UNAUTHENTICATED" ? "Your session has expired. Sign in again to view this asset."
        : code === "PERMISSION_DENIED" ? "You don't have permission, or your account or organization changed. Reload the page to check your access."
          : "The asset service couldn't complete this request. Check your connection and retry.";
    return { ok: false, status, code, message };
  }
}

const base = (assetId: string) => `/${encodeURIComponent(assetId)}`;

export function getAssetDetail(context: string, assetId: string, signal: AbortSignal): Promise<ProfileReadResult<AssetDetail>> {
  return readProfile(context, base(assetId), assetDetailSchema, signal);
}
export function getAssetFiles(context: string, assetId: string, signal: AbortSignal): Promise<ProfileReadResult<AssetFiles>> {
  return readProfile(context, `${base(assetId)}/files`, assetFilesSchema, signal);
}
export function getAssetWarranties(context: string, assetId: string, signal: AbortSignal): Promise<ProfileReadResult<AssetWarranty[]>> {
  return readProfile(context, `${base(assetId)}/warranties`, assetWarrantiesSchema, signal);
}
export function getAssetActivity(context: string, assetId: string, page: number, signal: AbortSignal): Promise<ProfileReadResult<AssetActivityPage>> {
  return readProfile(context, `${base(assetId)}/activity?page=${page}&pageSize=${ACTIVITY_PAGE_SIZE}`, assetActivityPageSchema, signal);
}
