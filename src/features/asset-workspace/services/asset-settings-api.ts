// Core read for the Settings page (PO 05 §4.12). Server-only. The save is a Server Action in asset-settings-actions.ts.
// Unlike reportGet, a 403 stays a 403: Manager / Employee get a no-access state, not an error.
import { z } from "zod";
import { env } from "@/config/env";
import { LABEL_IDENTIFIERS, type AssetSettings } from "../domain/asset-settings";
import { getAssetFilters, reportAuth } from "./asset-reports-api";

export const settingsSchema = z.object({
  assetTag: z.object({ prefix: z.string(), nextTag: z.string().nullable(), mode: z.literal("both") }),
  labels: z.object({
    identifier: z.enum(LABEL_IDENTIFIERS),
    fields: z.object({ name: z.boolean(), serial: z.boolean(), category: z.boolean(), location: z.boolean(), logo: z.boolean() }),
  }),
  inventoryDefaults: z.object({ dueDays: z.number(), categoryIds: z.array(z.string()) }),
  updatedAt: z.string().nullable(),
  updatedBy: z.object({ id: z.string(), name: z.string().nullable() }).nullable(),
});

export type SettingsRead =
  | { ok: true; data: AssetSettings }
  | { ok: false; reason: "unauthenticated" | "forbidden" | "error" };

export const settingsPath = (tenantId: string) => `${env.coreApiUrl}/api/core/v2/tenants/${tenantId}/asset-workspace/settings`;

export async function getAssetSettings(): Promise<SettingsRead> {
  const auth = await reportAuth();
  if (!auth) return { ok: false, reason: "unauthenticated" };
  try {
    const res = await fetch(settingsPath(auth.tenantId), {
      headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    });
    if (res.status === 401) return { ok: false, reason: "unauthenticated" };
    if (res.status === 403) return { ok: false, reason: "forbidden" };
    if (!res.ok) return { ok: false, reason: "error" };
    const parsed = settingsSchema.safeParse((await res.json().catch(() => null))?.data);
    return parsed.success ? { ok: true, data: parsed.data } : { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** Categories for the Inventory Defaults picker. `null` = failed; the tab then says so instead of offering an empty list. */
export async function getSettingsCategoryOptions(): Promise<{ value: string; label: string }[] | null> {
  const auth = await reportAuth();
  if (!auth) return null;
  const filters = await getAssetFilters(auth.token, auth.tenantId);
  return filters ? filters.categories.map((c) => ({ value: c.id, label: c.name ?? "Unnamed category" })) : null;
}

/** What a new Inventory Draft starts with (05 §4.12.3). `null` = not an Asset Admin or the read failed: the wizard then starts empty. */
export async function getInventoryDefaults(): Promise<AssetSettings["inventoryDefaults"] | null> {
  const read = await getAssetSettings();
  return read.ok ? read.data.inventoryDefaults : null;
}
