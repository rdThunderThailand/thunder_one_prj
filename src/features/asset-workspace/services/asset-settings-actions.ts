"use server";

// Settings save (Core v2 `asset-workspace/settings` PATCH) and re-read as Server Actions: the browser proxy only passes
// `v2/asset-workspace/assets`, and these need the same server-side token as the page read.
// Core checks the role (Asset Admin = manager and above) and every rule; its messages are shown for VALIDATION only.
import { env } from "@/config/env";
import type { AssetSettings, SettingsChange } from "../domain/asset-settings";
import { getAssetSettings, settingsPath, settingsSchema } from "./asset-settings-api";
import { reportAuth } from "./asset-reports-api";

export type SettingsSaveResult =
  | { ok: true; data: AssetSettings }
  | {
      ok: false;
      code: "UNAUTHENTICATED" | "FORBIDDEN" | "STALE" | "TAG_TAKEN" | "VALIDATION" | "FAILED" | "CONNECTION_FAILED";
      message: string;
      /** VALIDATION: field → messages, as Core sends them. */
      fieldErrors?: Record<string, string[]>;
    };

const failed = (code: Extract<SettingsSaveResult, { ok: false }>["code"], message: string) => ({ ok: false as const, code, message });

/** Save one tab. `expectedUpdatedAt` is the version the page loaded (`null` before the first save). */
export async function saveSettingsAction(expectedUpdatedAt: string | null, change: SettingsChange): Promise<SettingsSaveResult> {
  const auth = await reportAuth();
  if (!auth) return failed("UNAUTHENTICATED", "Sign in again to continue.");
  try {
    const res = await fetch(settingsPath(auth.tenantId), {
      method: "PATCH",
      headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ expectedUpdatedAt, ...change }),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (res.ok) {
      const parsed = settingsSchema.safeParse(json?.data);
      return parsed.success ? { ok: true, data: parsed.data } : failed("FAILED", "The save could not be confirmed. Reload to check the current settings.");
    }
    const code: string = json?.error?.code ?? "";
    if (res.status === 401) return failed("UNAUTHENTICATED", "Sign in again to continue.");
    if (res.status === 403) return failed("FORBIDDEN", "Only Asset Admins can change settings.");
    if (code === "STALE") return failed("STALE", "Settings were changed by someone else. Your input is kept; reload to see the latest, then save again.");
    if (code === "TAG_TAKEN") return failed("TAG_TAKEN", json?.error?.message ?? "The next tag already exists in your organization.");
    if (code === "VALIDATION") {
      const details = json?.error?.details;
      return { ...failed("VALIDATION", json?.error?.message ?? "Check the highlighted fields."), fieldErrors: details && typeof details === "object" ? details : undefined };
    }
    return failed("FAILED", "Settings could not be saved. Your input is kept; try again.");
  } catch {
    return failed("CONNECTION_FAILED", "The settings service could not be reached. Your input is kept; try again.");
  }
}

/** Re-read after a STALE refusal. */
export async function reloadSettingsAction(): Promise<{ ok: true; data: AssetSettings } | { ok: false }> {
  const read = await getAssetSettings();
  return read.ok ? { ok: true, data: read.data } : { ok: false };
}
