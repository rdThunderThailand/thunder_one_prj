import { resolveVersion, type FleetDevice } from "./device-state.ts";

// ADR 0029 amendment 1 items 3, 4 and 8: what the Rollout table says about a device, drawn from facts only.

export type DeviceStatus =
  | "test_group" | "updated" | "failed" | "timed_out" | "unsupported" | "updating"
  | "no_version" | "not_eligible" | "no_check" | "on_version" | "waiting";

/** The statuses of devices that should get the version: the rollout the summary counts. */
export const ROLLOUT_STATUSES = ["updated", "updating", "failed", "timed_out", "unsupported", "waiting"] as const;

export const STATUS_LABEL: Record<DeviceStatus, string> = {
  test_group: "In test group",
  updated: "Updated",
  failed: "Failed",
  timed_out: "Timed out",
  unsupported: "Not supported",
  updating: "Updating",
  no_version: "No version set",
  not_eligible: "Not eligible",
  no_check: "No update check yet",
  on_version: "Already on this version",
  waiting: "Waiting for slot",
};

export type RolloutTarget = { version: string | null; isPaused: boolean };
export type DeviceRollout = { status: DeviceStatus; label: string; reason: string | null };

// ponytail: an unparseable version counts as below the target (the device is shown as waiting); SQL would raise on it.
function isBelow(version: string, target: string) {
  const a = version.split(".").map(Number);
  const b = target.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (Number.isNaN(x) || Number.isNaN(y)) return true;
    if (x !== y) return x < y;
  }
  return false;
}

const OUTCOME_STATUS = { healthy: "updated", failed: "failed", timed_out: "timed_out", unsupported: "unsupported", in_flight: "updating" } as const;

/** First match wins. The outcome comes before every eligibility test because the cap counts a live offer whatever the device checks later. */
export function rolloutOf(device: FleetDevice, target: RolloutTarget): DeviceRollout {
  const make = (status: DeviceStatus, reason: string | null = null): DeviceRollout => ({
    status,
    reason,
    label: target.isPaused && (status === "updating" || status === "waiting") ? "Paused" : status === "not_eligible" && reason ? `Not eligible: ${reason}` : STATUS_LABEL[status],
  });
  if (device.ring === "pilot") return make("test_group");
  if (device.production_outcome) return make(OUTCOME_STATUS[device.production_outcome]);
  if (!target.version) return make("no_version");
  const check = device.last_check;
  if (check && check.update_track !== "windows-x64") return make("not_eligible", `updates ${check.update_track}`);
  if (check && check.update_install_mode !== "windows_managed") return make("not_eligible", `install mode ${check.update_install_mode}`);
  if (!check || !device.is_recent_check) return make("no_check");
  if (!isBelow(check.app_version, target.version)) return make("on_version");
  return make("waiting");
}

export const isInRollout = (status: DeviceStatus) => (ROLLOUT_STATUSES as readonly string[]).includes(status);

/** Count per status over the device rows: the table and the summary come from the same helper, so they cannot disagree. */
export function countStatuses(devices: FleetDevice[], target: RolloutTarget) {
  const counts = Object.fromEntries(Object.keys(STATUS_LABEL).map((status) => [status, 0])) as Record<DeviceStatus, number>;
  for (const device of devices) counts[rolloutOf(device, target).status] += 1;
  return counts;
}

/** The version a row shows: the last update-check (what the cap compared), else what the device reported. */
export const shownVersion = (device: FleetDevice) => device.last_check?.app_version ?? resolveVersion(device)?.version ?? null;

export const STAGES = ["checking", "downloading", "verified", "waiting_window", "installing", "started"] as const;
export const STAGE_LABEL: Record<(typeof STAGES)[number], string> = {
  checking: "Checking",
  downloading: "Downloading",
  verified: "Verified",
  waiting_window: "Waiting for install window",
  installing: "Installing",
  started: "Starting",
};

export type DeviceProgress = { step: number; total: number; tone: "primary" | "success" | "warning" | "error" | "neutral"; label: string };

/** The bar follows the newest report only while the device is updating; every other status is a full bar or none. */
export function progressOf(device: FleetDevice, rollout: DeviceRollout): DeviceProgress | null {
  const total = STAGES.length;
  switch (rollout.status) {
    case "updated": return { step: total, total, tone: "success", label: "Updated" };
    case "failed": return { step: total, total, tone: "error", label: "Failed" };
    case "timed_out": return { step: total, total, tone: "warning", label: "No report in time" };
    case "unsupported": return { step: total, total, tone: "neutral", label: "Not supported" };
    case "updating": break;
    default: return null;
  }
  const report = device.target_report;
  if (!report) return { step: 0, total, tone: "primary", label: "Offered" };
  if (report.state === "awaiting_user_action") return { step: 3, total, tone: "warning", label: "Needs someone at the screen" };
  if (report.state === "revoked") return { step: 0, total, tone: "error", label: "Release withdrawn" };
  // A download failure is a retry the Player makes itself, so it reads as downloading, not as a failure.
  const state = report.state === "failed" && report.error_stage === "download" ? "downloading" : report.state;
  const index = (STAGES as readonly string[]).indexOf(state);
  if (index < 0) return { step: 0, total, tone: "primary", label: "Offered" };
  return { step: index + 1, total, tone: "primary", label: STAGE_LABEL[STAGES[index]] };
}
