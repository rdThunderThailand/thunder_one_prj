"use server";

// Inventory session writes (Core v2 `inventory-sessions` POST, `{id}` PATCH, `{id}/cancel`) and the step 2 scope
// preview (a read sent as POST) as Server Actions: the browser proxy only passes `v2/asset-workspace/assets|categories`,
// and these need the same server-side token as the reads. Core checks the role (Asset Admin) and every rule.
import { refresh } from "next/cache";
import { env } from "@/config/env";
import type { ScopeInput, ScopeMode, SessionDetail, SetupInput } from "../domain/inventory";
import { reportAuth } from "./asset-reports-api";

export type InventoryWriteResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: string;
      message: string;
      /** VALIDATION: field → messages. */
      fieldErrors?: Record<string, string[]>;
    };

async function coreCall<T>(method: "POST" | "PATCH", path: string, body: unknown, reread = true): Promise<InventoryWriteResult<T>> {
  const auth = await reportAuth();
  if (!auth) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in again to continue." };
  try {
    const res = await fetch(`${env.coreApiUrl}/api/core/v2/tenants/${auth.tenantId}/asset-workspace/inventory-sessions${path}`, {
      method,
      headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.data) {
      if (reread) refresh();
      return { ok: true, data: json.data as T };
    }
    const error = json?.error ?? {};
    const code: string = error.code ?? "REQUEST_FAILED";
    if (res.status === 403) return { ok: false, code, message: "Only Asset Admins can manage inventory sessions." };
    if (code === "STALE") return { ok: false, code, message: "Someone else changed this session. Reload to see the latest version." };
    return {
      ok: false,
      code,
      message: res.status >= 500 || !error.message ? "The inventory service couldn't do this. Try again." : error.message,
      fieldErrors: code === "VALIDATION" && error.details && typeof error.details === "object" ? error.details : undefined,
    };
  } catch {
    return { ok: false, code: "CONNECTION_FAILED", message: "The inventory service could not be reached. Try again." };
  }
}

const idPath = (id: string) => `/${encodeURIComponent(id)}`;

/** Wizard step 1 Next: a new Draft. */
export async function createSessionAction(input: SetupInput) {
  return coreCall<SessionDetail>("POST", "", input);
}

/** Send only the changed keys; `expectedUpdatedAt` guards against a lost update (STALE). */
export async function updateSessionAction(
  id: string,
  expectedUpdatedAt: string,
  changes: Partial<SetupInput> & { scopeMode?: ScopeMode; scope?: ScopeInput | null },
) {
  return coreCall<SessionDetail>("PATCH", idPath(id), { ...changes, expectedUpdatedAt });
}

export async function cancelSessionAction(id: string, reason: string) {
  return coreCall<SessionDetail>("POST", `${idPath(id)}/cancel`, { reason });
}

export interface ScopeAsset {
  id: string;
  name: string;
  assetTag: string;
  category: { id: string; name: string | null } | null;
  location: { id: string; name: string | null } | null;
}

export interface ScopePreview {
  total: number;
  byLocation: { id: string; name: string; count: number }[];
  byCategory: { id: string; name: string; count: number }[];
  assets: { data: ScopeAsset[]; page: number; pageSize: number; total: number; totalPages: number };
}

/** Step 2 Expected Assets Preview / View Assets. Writes nothing, so no re-render. */
export async function previewScopeAction(scopeMode: ScopeMode, scope: ScopeInput, page = 1, pageSize = 10) {
  return coreCall<ScopePreview>("POST", "/scope-preview", { scopeMode, scope, page, pageSize }, false);
}

/** Specific Assets picker: first 10 matches by name / tag / serial (`assets/list?q=`). */
export async function searchAssetsAction(q: string): Promise<ScopeAsset[] | null> {
  const auth = await reportAuth();
  if (!auth) return null;
  const params = new URLSearchParams({ q: q.trim(), pageSize: "10" });
  try {
    const res = await fetch(`${env.coreApiUrl}/api/core/v2/tenants/${auth.tenantId}/asset-workspace/assets/list?${params}`, {
      headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${auth.token}` },
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    return res.ok && Array.isArray(json?.data?.data) ? (json.data.data as ScopeAsset[]) : null;
  } catch {
    return null;
  }
}
