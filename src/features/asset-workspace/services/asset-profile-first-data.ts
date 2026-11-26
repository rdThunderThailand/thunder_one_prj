// First data of the Asset Profile, read from Core on the server. Server-only.
// The reads are not awaited: the page is sent first and the profile shows when they are ready.
// Every failure is `null`: the browser then loads that part and shows its own message.
import { assetDetailSchema, assetFilesSchema, type AssetDetail, type AssetFiles } from "./asset-profile-contract";
import { assetServerReader } from "./asset-server-read";
import type { SectionSeed } from "./assets-list-seed";

export interface ProfileFirstData {
  detail: SectionSeed<AssetDetail>;
  files: SectionSeed<AssetFiles>;
}

/** `context` and `assetId` must be the ones the page passes to its view: they name the request each seed answers. */
export async function startProfileFirstData(token: string, tenantId: string, context: string, assetId: string): Promise<ProfileFirstData> {
  const read = await assetServerReader(token, tenantId);
  const key = `${context}:${assetId}`;
  const at = Date.now();
  const path = `/${encodeURIComponent(assetId)}`;
  return {
    detail: { key, at, data: read(path, assetDetailSchema) },
    files: { key, at, data: read(`${path}/files`, assetFilesSchema) },
  };
}
