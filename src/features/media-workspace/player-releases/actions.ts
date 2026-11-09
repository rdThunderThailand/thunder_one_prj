"use server";

import { env } from "@/config/env";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";

type Selection = { name: string; version: string; files: { name: string; size: number }[] };
type Command =
  | (Selection & { action: "prepare" })
  | (Selection & { action: "register"; id: string })
  | { action: "download"; id: string; file: string };

type Release = {
  id: string;
  display_name: string;
  version: string;
  files: { name: string; size: number; sha256: string }[];
  // player_releases.download_id is unique, so PostgREST embeds one object or null, never an array.
  admitted: { id: string; status: "ready" | "revoked"; admitted_at: string } | null;
};

type Device = { id: string; name: string; tenant_id: string; app_version: string | null; last_heartbeat_at: string | null };
type PilotMember = {
  ring: string;
  added_at: string;
  device: Device | null;
  last_check: { app_version: string; checked_at: string } | null;
  latest_report: { state: string; running_version: string | null; error_code: string | null; received_at: string } | null;
};
type Target = { release_id: string | null; paused: boolean; policy_revision: number; updated_at: string } | null;

type Result<T> = { data: T } | { error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PILOT_TARGET = "player-update/targets/pilot/windows-x64";

/** Calls a Core Player release admin route. A 400 shows Core's own reason when `showReason` is set. */
async function coreRequest<T>(
  path: string,
  init: { method: string; body?: unknown; showReason?: boolean; conflict?: string } = { method: "GET" },
): Promise<Result<T>> {
  const session = await getSession();
  if (session === "forbidden" || !session.isSuperAdmin) return { error: "Player releases require platform administrator access." };
  const token = await getAuthToken();
  if (!token || !env.coreApiUrl || !env.coreApiKey) return { error: "Could not connect to Player releases." };
  try {
    const response = await fetch(`${env.coreApiUrl}/api/core/v1/media/${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "x-api-key": env.coreApiKey,
        "Content-Type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
    });
    const payload = await response.json();
    if (response.ok && payload.success) return { data: payload.data as T };
    const reason = typeof payload.error === "string" && payload.error.startsWith("Invalid input: ")
      ? payload.error.slice("Invalid input: ".length)
      : "";
    if (response.status === 400 && init.showReason && reason) return { error: `${reason[0].toUpperCase()}${reason.slice(1)}.` };
    if (response.status === 409) return { error: init.conflict ?? "This version is already registered." };
    if (response.status === 400) return { error: "Check the release details and upload all selected files." };
    if (response.status === 401 || response.status === 403) return { error: "Player releases require platform administrator access." };
    if (response.status === 404) return { error: "This item no longer exists. Refresh the page." };
    return { error: "Could not complete the Player release request. Try again." };
  } catch {
    return { error: "Could not connect to Player releases. Try again." };
  }
}

function command<T>(body: Command) {
  return coreRequest<T>("player-releases", { method: "POST", body });
}

function byId<T>(id: string, run: () => Promise<Result<T>>): Promise<Result<T>> {
  return UUID.test(id) ? run() : Promise.resolve({ error: "This item no longer exists. Refresh the page." });
}

export async function listPlayerReleases() {
  return coreRequest<Release[]>("player-releases");
}

export async function preparePlayerRelease(selection: Selection) {
  return command<{ id: string; uploads: { name: string; url: string }[] }>({ ...selection, action: "prepare" });
}

export async function registerPlayerRelease(id: string, selection: Selection) {
  return command<{ id: string }>({ ...selection, action: "register", id });
}

export async function downloadPlayerRelease(id: string, file: string) {
  return command<{ url: string }>({ action: "download", id, file });
}

/** ADR 0028 §4: Core verifies the signed manifest, copies the files to the public bucket and records the release. */
export async function admitPlayerRelease(downloadId: string) {
  return byId(downloadId, () => coreRequest<{ id: string }>(`player-releases/${downloadId}/admit`, {
    method: "POST", showReason: true, conflict: "This release was already admitted with different files. Refresh the page.",
  }));
}

/** ADR 0028 §8: one way; a target on this release is cleared in the same step. */
export async function revokePlayerRelease(admittedId: string) {
  return byId(admittedId, () => coreRequest<null>(`player-releases/admitted/${admittedId}/revoke`, { method: "POST" }));
}

// Pilot page (ADR 0028 §11): one ring, one track.

export async function listPilotMembers() {
  return coreRequest<PilotMember[]>("player-update/devices");
}

export async function searchDevices(search: string) {
  return coreRequest<Device[]>(`player-update/devices?search=${encodeURIComponent(search.trim())}`);
}

export async function addPilotMember(assetId: string) {
  return byId(assetId, () => coreRequest<null>(`player-update/ring-members/${assetId}`, { method: "PUT", body: { ring: "pilot" }, showReason: true }));
}

export async function removePilotMember(assetId: string) {
  return byId(assetId, () => coreRequest<null>(`player-update/ring-members/${assetId}`, { method: "DELETE" }));
}

export async function getPilotTarget() {
  return coreRequest<Target>(PILOT_TARGET);
}

export async function setPilotTarget(releaseId: string | null) {
  if (releaseId !== null && !UUID.test(releaseId)) return { error: "Choose an admitted release." };
  return coreRequest<{ policy_revision: number }>(PILOT_TARGET, { method: "PUT", body: { release_id: releaseId }, showReason: true });
}

export async function pausePilotTarget(isPaused: boolean) {
  return coreRequest<{ policy_revision: number }>(PILOT_TARGET, { method: "PUT", body: { paused: isPaused }, showReason: true });
}
