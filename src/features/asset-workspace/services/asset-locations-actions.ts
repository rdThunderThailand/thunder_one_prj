"use server";

// Location writes (Core v2 `locations` POST, `locations/{id}` PATCH, `…/activate`, `…/deactivate`) as Server Actions:
// the browser proxy only passes `v2/asset-workspace/assets`, and these need the same server-side token as the reads.
// Core checks the role (Asset Admin = manager and above) and every rule; its messages are shown as-is.
import { refresh } from "next/cache";
import { env } from "@/config/env";
import type { LocationInput } from "../domain/location";
import { reportAuth } from "./asset-reports-api";

export type LocationWriteResult =
  | { ok: true; id: string }
  | {
      ok: false;
      code: string;
      message: string;
      /** VALIDATION: field → messages. */
      fieldErrors?: Record<string, string[]>;
      /** Deactivate refused: what still sits there. */
      blockers?: { activeAssets: number; activeChildren: number };
    };

async function coreWrite(method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<LocationWriteResult> {
  const auth = await reportAuth();
  if (!auth) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in again to continue." };
  try {
    const res = await fetch(`${env.coreApiUrl}/api/core/v2/tenants/${auth.tenantId}/asset-workspace/locations${path}`, {
      method,
      headers: {
        "x-api-key": env.coreApiKey,
        Authorization: `Bearer ${auth.token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    // Locations answer `{ id }`; attachment add / unlink answer `{ linkId }`.
    const id = json?.data?.id ?? json?.data?.linkId;
    if (res.ok && id) {
      refresh();
      return { ok: true, id };
    }
    const error = json?.error ?? {};
    const code: string = error.code ?? "REQUEST_FAILED";
    const details = error.details;
    if (res.status === 403) return { ok: false, code, message: "Only Asset Admins can change locations." };
    return {
      ok: false,
      code,
      message: res.status >= 500 || !error.message ? "The location service couldn't save this. Try again." : error.message,
      fieldErrors: code === "VALIDATION" && details && typeof details === "object" ? details : undefined,
      blockers: code === "INVALID_STATE" && typeof details?.activeAssets === "number" ? details : undefined,
    };
  } catch {
    return { ok: false, code: "CONNECTION_FAILED", message: "The location service could not be reached. Try again." };
  }
}

const idPath = (id: string) => `/${encodeURIComponent(id)}`;

export async function createLocationAction(input: LocationInput) {
  return coreWrite("POST", "", input);
}

/** Send only the changed keys; `expectedUpdatedAt` guards against a lost update (STALE). */
export async function updateLocationAction(id: string, expectedUpdatedAt: string, changes: Partial<LocationInput>) {
  return coreWrite("PATCH", idPath(id), { ...changes, expectedUpdatedAt });
}

export async function setLocationStatusAction(id: string, action: "activate" | "deactivate") {
  return coreWrite("POST", `${idPath(id)}/${action}`);
}

/** Link a file completed through the registration upload routes (purpose asset_document) to this location. */
export async function attachLocationFileAction(locationId: string, fileId: string) {
  return coreWrite("POST", `${idPath(locationId)}/attachments`, { fileId });
}

/** Unlink only: the file stays in Shared Files. */
export async function unlinkLocationAttachmentAction(locationId: string, linkId: string) {
  return coreWrite("DELETE", `${idPath(locationId)}/attachments/${encodeURIComponent(linkId)}`);
}
