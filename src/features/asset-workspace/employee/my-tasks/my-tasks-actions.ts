"use server";

// My Tasks writes (EMP-03) as server actions: `/me/inventory-tasks/{id}/verifications` and `/unexpected`. Core runs
// every rule (In Progress, assigned to the caller, STALE) and never changes the asset record (AC-016).
import { refresh } from "next/cache";
import { env } from "@/config/env";
import type { VerifyInput } from "../../domain/inventory";
import { reportAuth } from "../../services/asset-reports-api";

export type TaskWriteResult = { ok: true } | { ok: false; code: string; message: string };

async function post(id: string, path: string, body: unknown): Promise<TaskWriteResult> {
  const auth = await reportAuth();
  if (!auth) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in again to continue." };
  try {
    const res = await fetch(`${env.coreApiUrl}/api/core/v2/tenants/${auth.tenantId}/asset-workspace/me/inventory-tasks/${encodeURIComponent(id)}${path}`, {
      method: "POST",
      headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.data) {
      refresh();
      return { ok: true };
    }
    const error = json?.error ?? {};
    const code: string = error.code ?? "REQUEST_FAILED";
    if (res.status === 403) return { ok: false, code, message: "This asset isn't assigned to you." };
    return { ok: false, code, message: res.status >= 500 || !error.message ? "The inventory service couldn't do this. Try again." : error.message };
  } catch {
    return { ok: false, code: "CONNECTION_FAILED", message: "The inventory service could not be reached. Try again." };
  }
}

export async function verifyMyAssetAction(id: string, input: VerifyInput) {
  return post(id, "/verifications", input);
}

export async function reportMyUnexpectedAction(id: string, input: { unexpectedIdentifier: string; foundLocationId?: string; note?: string }) {
  return post(id, "/unexpected", input);
}
