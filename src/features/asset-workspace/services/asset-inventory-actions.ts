"use server";

// Inventory session writes (Core v2 `inventory-sessions` POST, `{id}` PATCH, `{id}/cancel`, `/assignments`, `/start`, `/verifications`,
// `/findings`, `/complete`, `/findings/{id}/reconcile`, `/close`) and the step 2 scope
// preview (a read sent as POST) as Server Actions: the browser proxy only passes `v2/asset-workspace/assets|categories`,
// and these need the same server-side token as the reads. Core checks the role (Asset Admin) and every rule.
import { refresh } from "next/cache";
import { env } from "@/config/env";
import type { Assignments, Finding, ReconcileInput, ScopeInput, ScopeMode, SessionDetail, SetupInput, VerifyInput } from "../domain/inventory";
import { reportAuth } from "./asset-reports-api";

export type InventoryWriteResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: string;
      message: string;
      /** VALIDATION: field → messages. */
      fieldErrors?: Record<string, string[]>;
      /** Any other error's `details` as Core sent them (e.g. UNRESOLVED_FINDINGS `{ open, items }`). */
      details?: unknown;
    };

const ADMIN_ONLY = "Only Asset Admins can manage inventory sessions.";

async function coreCall<T>(
  method: "POST" | "PATCH",
  path: string,
  body: unknown,
  reread = true,
  forbidden = ADMIN_ONLY,
): Promise<InventoryWriteResult<T>> {
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
    if (res.status === 403) return { ok: false, code, message: forbidden };
    if (code === "STALE") return { ok: false, code, message: "Someone else changed this session. Reload to see the latest version." };
    return {
      ok: false,
      code,
      message: res.status >= 500 || !error.message ? "The inventory service couldn't do this. Try again." : error.message,
      fieldErrors: code === "VALIDATION" && error.details && typeof error.details === "object" ? error.details : undefined,
      details: error.details,
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

/** Edit Assignments (Draft only): every asset now under `fromUserId` goes to `toUserId`. */
export async function reassignAction(id: string, expectedUpdatedAt: string, moves: { fromUserId: string; toUserId: string }[]) {
  return coreCall<Assignments>("PATCH", `${idPath(id)}/assignments`, { expectedUpdatedAt, moves });
}

/** Start Inventory: Core freezes the snapshot and creates one task per asset. */
export async function startSessionAction(id: string, expectedUpdatedAt: string) {
  return coreCall<SessionDetail>("POST", `${idPath(id)}/start`, { expectedUpdatedAt });
}

/** Verify dialog: record or change one expected asset's result (In Progress; the row's assignee or an Asset Admin). */
export async function verifyAssetAction(id: string, input: VerifyInput) {
  return coreCall<{ id: string; findings: { id: string; type: string }[] }>(
    "POST", `${idPath(id)}/verifications`, input, true, "Only the assignee of this asset or an Asset Admin can verify it.",
  );
}

/** Report Unexpected Asset (D3): a finding only, no asset is registered. */
export async function reportUnexpectedAction(id: string, input: { unexpectedIdentifier: string; foundLocationId?: string; note?: string }) {
  return coreCall<{ id: string }>("POST", `${idPath(id)}/findings`, input, true, "Only people assigned to this session can report assets.");
}

/** Complete Inventory: unchecked assets stay Remaining (D1). */
export async function completeSessionAction(id: string, expectedUpdatedAt: string) {
  return coreCall<SessionDetail>("POST", `${idPath(id)}/complete`, { expectedUpdatedAt });
}

/** Reconcile one open finding of a Completed session (D6): records the decision; the asset was changed first. */
export async function reconcileFindingAction(id: string, findingId: string, input: ReconcileInput) {
  return coreCall<{ id: string }>("POST", `${idPath(id)}/findings/${encodeURIComponent(findingId)}/reconcile`, input);
}

export interface UnresolvedFindings {
  open: number;
  items: Finding[];
}

/** Close Session (D2): open findings answer 409 UNRESOLVED_FINDINGS (`details`) until `confirmUnresolved` is sent. */
export async function closeSessionAction(id: string, expectedUpdatedAt: string, confirmUnresolved = false) {
  return coreCall<SessionDetail>("POST", `${idPath(id)}/close`, {
    expectedUpdatedAt,
    ...(confirmUnresolved ? { confirmUnresolved: true } : {}),
  });
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

export interface PersonChoice {
  id: string;
  name: string;
  detail: string;
}

/** Edit Assignments picker: active members by name / employee code (`assets/registration-options/persons?q=`). */
export async function searchPeopleAction(q: string): Promise<PersonChoice[] | null> {
  const auth = await reportAuth();
  if (!auth) return null;
  const params = new URLSearchParams({ q: q.trim() });
  try {
    const res = await fetch(
      `${env.coreApiUrl}/api/core/v2/tenants/${auth.tenantId}/asset-workspace/assets/registration-options/persons?${params}`,
      { headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${auth.token}` }, cache: "no-store" },
    );
    const json = await res.json().catch(() => null);
    const items: unknown = json?.data?.items;
    if (!res.ok || !Array.isArray(items)) return null;
    return items.map((p: { id: string; name: string | null; secondary_label?: string; employee_code?: string | null }) => ({
      id: p.id,
      name: p.name?.trim() || "Unnamed person",
      detail: p.secondary_label || p.employee_code || "",
    }));
  } catch {
    return null;
  }
}
