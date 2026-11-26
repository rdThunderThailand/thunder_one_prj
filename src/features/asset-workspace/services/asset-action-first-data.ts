// First data of an action page (Assign, Transfer, Return, Change Status, Retire, Dispose), read from Core on the server. Server-only.
// The reads are not awaited: the page is sent first and the form shows when they are ready.
import { assetServerReader } from "./asset-server-read";
import { assetDetailSchema, type AssetDetail } from "./asset-profile-contract";
import { registrationOptionsSchema, type RegistrationOptions } from "./asset-registration-contract";
import type { SectionSeed } from "./assets-list-seed";

export interface ActionFirstData {
  detail: SectionSeed<AssetDetail>;
  options: SectionSeed<RegistrationOptions>;
}

/** `context` and `assetId` must be the ones the page passes to its view: they name the request each seed answers. */
export async function startActionFirstData(token: string, tenantId: string, context: string, assetId: string): Promise<ActionFirstData> {
  const read = await assetServerReader(token, tenantId);
  const at = Date.now();
  return {
    detail: { key: `${context}:${assetId}`, at, data: read(`/${encodeURIComponent(assetId)}`, assetDetailSchema) },
    options: { key: context, at, data: read("/registration-options", registrationOptionsSchema) },
  };
}
