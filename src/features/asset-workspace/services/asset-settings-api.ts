// Core read for the Settings page (PO 05 §4.12). Server-only. The save is a Server Action in asset-settings-actions.ts.
// Unlike reportGet, a 403 stays a 403: Manager / Employee get a no-access state, not an error.
import { z } from "zod";
import { env } from "@/config/env";
import { FIRST_DAYS, LABEL_IDENTIFIERS, PAGE_SIZES, PREFERENCE_SORTS, PREFERENCE_VIEWS, type AssetSettings, type WorkspacePreferences } from "../domain/asset-settings";
import { getAssetFilters, reportAuth } from "./asset-reports-api";

const preferencesSchema = z.object({
  views: z.object({
    assets: z.enum(PREFERENCE_VIEWS),
    assignments: z.enum(PREFERENCE_VIEWS),
    inventory: z.enum(PREFERENCE_VIEWS),
    locations: z.enum(PREFERENCE_VIEWS),
  }),
  pageSize: z.union([z.literal(PAGE_SIZES[0]), z.literal(PAGE_SIZES[1]), z.literal(PAGE_SIZES[2]), z.literal(PAGE_SIZES[3])]),
  sort: z.enum(PREFERENCE_SORTS),
  rememberFilters: z.boolean(),
  firstDayOfWeek: z.enum(FIRST_DAYS),
});

export const settingsSchema = z.object({
  assetTag: z.object({ prefix: z.string(), nextTag: z.string().nullable(), mode: z.literal("both") }),
  labels: z.object({
    identifier: z.enum(LABEL_IDENTIFIERS),
    fields: z.object({ name: z.boolean(), serial: z.boolean(), category: z.boolean(), location: z.boolean(), logo: z.boolean() }),
  }),
  preferences: preferencesSchema,
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

/**
 * The org's Workspace Preferences for any member (Core `asset-workspace/preferences`; Settings GET is Asset Admin only).
 * `null` on any failure: the screen then keeps its built-in defaults.
 */
export async function getWorkspacePreferences(): Promise<WorkspacePreferences | null> {
  const auth = await reportAuth();
  if (!auth) return null;
  try {
    const res = await fetch(`${env.coreApiUrl}/api/core/v2/tenants/${auth.tenantId}/asset-workspace/preferences`, {
      headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const parsed = z.object({ preferences: preferencesSchema }).safeParse((await res.json().catch(() => null))?.data);
    return parsed.success ? parsed.data.preferences : null;
  } catch {
    return null;
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
