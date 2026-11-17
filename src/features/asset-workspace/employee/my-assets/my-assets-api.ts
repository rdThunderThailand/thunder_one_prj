// Core reads for My Assets (EMP-02): `/me/assets` and `/me/assets/{assetId}` (Thunder_Core
// docs/api/asset-workspace-employee.md). Server-only; Core forces custody to the caller.
import { z } from "zod";
import { reportAuth, reportGet } from "../../services/asset-reports-api";
import { assetListQueryString, type AssetListQuery } from "../../services/assets-list-query";
import { assetListSchema, type AssetListData } from "../../services/assets-list-types";
import { choicesFrom } from "./my-assets-query";

const base = (tenantId: string) => `/tenants/${tenantId}/asset-workspace/me/assets`;

async function readList(query: AssetListQuery): Promise<AssetListData | null> {
  const auth = await reportAuth();
  if (!auth) return null;
  const body = await reportGet<unknown>(`${base(auth.tenantId)}?${assetListQueryString(query)}`, auth.token);
  if (body === "unavailable") return null;
  const parsed = assetListSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

/** A page of the caller's assets; `null` = Core failed or the response was unexpected. */
export function getMyAssets(query: AssetListQuery) {
  return readList(query);
}

/** Category / Location filter choices from the assets the caller holds. */
export async function getMyAssetChoices() {
  const all = await readList({ page: 1, pageSize: 200, sort: "created_at" });
  return all && choicesFrom(all.rows);
}

const reference = z.object({ id: z.string(), name: z.string().nullable() });
const date = z.string().nullable();

// The employee allow-list only; admin-only fields (notes, QR, warranty reference) are never sent.
const myAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  assetTag: z.string(),
  serialNumber: z.string().nullable(),
  category: reference.nullable(),
  categoryPath: z.array(reference).default([]),
  description: z.string().nullable().default(null),
  acquisitionDate: date,
  updatedAt: z.string(),
  location: reference.nullable(),
  locationPath: z.array(reference).default([]),
  lifecycleStatus: z.string(),
  condition: z.string().nullable(),
  custody: reference.extend({
    type: z.enum(["person", "org_unit"]),
    since: date.default(null),
    avatarUrl: z.string().nullable(),
    department: reference.nullable(),
  }).nullable(),
  currentWarranty: z.object({
    provider: z.string().nullable(),
    type: date,
    startDate: date,
    endDate: date,
    expiryStatus: z.enum(["Active", "Expiring Soon", "Expired"]),
  }).nullable().default(null),
});
export type MyAsset = z.infer<typeof myAssetSchema>;

/** `"not-found"` covers an asset someone else holds and one that does not exist (AC-005). */
export async function getMyAsset(assetId: string): Promise<MyAsset | "not-found" | null> {
  const auth = await reportAuth();
  if (!auth) return null;
  const body = await reportGet<unknown>(`${base(auth.tenantId)}/${encodeURIComponent(assetId)}`, auth.token);
  if (body === "unavailable") return "not-found";
  const parsed = myAssetSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

/** The asset's list thumbnail: the `/me` detail allow-list carries no photo, the list row does.
 *  shortcut: one extra list read by Asset Tag; add the photo to the detail allow-list if Core ever changes it. */
export async function getMyAssetPhoto(asset: Pick<MyAsset, "id" | "assetTag">): Promise<string | null> {
  const page = await readList({ page: 1, pageSize: 10, sort: "created_at", q: asset.assetTag });
  return page?.rows.find((row) => row.id === asset.id)?.thumbnail_url ?? null;
}
