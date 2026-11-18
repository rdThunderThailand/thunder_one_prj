// ADR 0028 §11 items 3 and 4: what the All devices page shows and which devices it lets a super admin add.

export type FleetDevice = {
  id: string;
  name: string;
  tenant_id: string;
  tenant_name: string | null;
  registry_status: string;
  lifecycle_status: string | null;
  os_version: string | null;
  app_version: string | null;
  last_heartbeat_at: string | null;
  health: "online" | "warning" | "offline";
  ring: string | null;
  active_channel: { id: string; name: string } | null;
  last_check: { app_version: string; update_track: string; update_install_mode: string; os_version: string | null; checked_at: string } | null;
  latest_report: { state: string; occurred_at: string } | null;
  reported_version: string | null;
  // ADR 0029 amendment 1: rollout facts from player_update_devices_list.
  is_recent_check: boolean | null;
  production_outcome: "in_flight" | "healthy" | "failed" | "timed_out" | "unsupported" | null;
  target_report: { state: string; error_stage: string | null; error_code: string | null; received_at: string } | null;
};

export type ResolvedVersion = { version: string; source: "update report" | "update check" | "device record" };

const RETIRED = new Set(["DECOMMISSIONED", "RETIRED", "DISPOSED"]);

/** Same order as the Pilot page: the newest report's running version, then the last update-check, then the device record. */
export function resolveVersion(device: FleetDevice): ResolvedVersion | null {
  if (device.reported_version) return { version: device.reported_version, source: "update report" };
  if (device.last_check) return { version: device.last_check.app_version, source: "update check" };
  if (device.app_version) return { version: device.app_version, source: "device record" };
  return null;
}

/** ADR 0028 amendment 5 item 6: the update-check's version, else the device record's. Never the update report, which a hand install does not refresh. */
export const currentVersion = (device: FleetDevice) => device.last_check?.app_version ?? device.app_version;

export const osOf = (device: FleetDevice) => device.last_check?.os_version ?? device.os_version;

export const isWindows = (device: FleetDevice) => /windows/i.test(osOf(device) ?? "");

export type CheckStatus = "pass" | "fail" | "unknown";

/** One line of the modal's checklist. `reason` is the short blocker text, used only when the check fails. */
export type PilotCheck = { label: string; status: CheckStatus; reason: string; note: string };

/** A short reason for the row and a sentence that says what the device reported and what to do. */
export type PilotBlocker = { reason: string; detail: string };

const PASS_MODE = "windows_managed";
const PASS_TRACK = "windows-x64";

/**
 * Every guard in the order they apply, each passing, failing or unknown (no update-check to judge by). A One guard
 * only: Core accepts any Media Device. Without an update-check the OS is a hint and never blocks, because
 * update-check eligibility rests on install mode and track (Decision 9).
 */
export function pilotChecks(device: FleetDevice): PilotCheck[] {
  const check = device.last_check;
  const checkedAt = check ? formatTime(check.checked_at) : "";
  const isConnected = ["active", "registered"].includes(device.registry_status) || !!device.last_heartbeat_at || !!check;
  const isRetired = !!device.lifecycle_status && RETIRED.has(device.lifecycle_status.toUpperCase());
  const status = (isFail: boolean, isKnown = true): CheckStatus => (isFail ? "fail" : isKnown ? "pass" : "unknown");
  return [
    {
      label: "Not in an update group yet",
      status: status(!!device.ring),
      reason: "Already in the update group",
      note: device.ring ? `It is in the ${device.ring} group. Remove it on the Pilot page first to add it again.` : "Not a member of any group.",
    },
    {
      // ADR 0028 amendment 7: the Player picker's rule. Core writes pending, then active; registered is legacy seed data.
      label: "Still registered with its tenant",
      status: status(device.registry_status === "unregistered"),
      reason: "Unregistered",
      note: device.registry_status === "unregistered"
        ? "This device was unregistered from its tenant. Register it again before adding it."
        : `Registration is ${device.registry_status}.`,
    },
    {
      label: "Has connected to Core",
      status: status(!isConnected),
      reason: "Never connected",
      note: isConnected
        ? "A heartbeat, an update check or an active registration was seen."
        : `Registration is ${device.registry_status} and no heartbeat or update check has arrived. Activate the Player on the device and let it connect once.`,
    },
    {
      label: "In service",
      status: status(isRetired),
      reason: "Decommissioned",
      note: isRetired ? `Its lifecycle status is ${device.lifecycle_status}. Only devices in service can be added.` : `Lifecycle status is ${device.lifecycle_status ?? "not set"}.`,
    },
    {
      label: `Updates the ${PASS_TRACK} track`,
      status: status(!!check && check.update_track !== PASS_TRACK, !!check),
      reason: `Updates ${check?.update_track}, not ${PASS_TRACK}`,
      note: !check
        ? "No update check yet, so this is not known. It does not block."
        : check.update_track !== PASS_TRACK
          ? `Its last update check (${checkedAt}) reported track ${check.update_track}. The update group only offers ${PASS_TRACK} builds.`
          : `Its last update check (${checkedAt}) reported ${check.update_track}.`,
    },
    {
      label: "Installs updates itself",
      status: status(!!check && check.update_install_mode !== PASS_MODE, !!check),
      reason: `Install mode ${check?.update_install_mode}`,
      note: !check
        ? "No update check yet, so this is not known. It does not block."
        : check.update_install_mode !== PASS_MODE
          ? `Its last update check (${checkedAt}) reported install mode ${check.update_install_mode}. The device must install updates itself (${PASS_MODE}).`
          : `Its last update check (${checkedAt}) reported ${check.update_install_mode}.`,
    },
    {
      label: "Not on 1.0.4",
      status: status(currentVersion(device) === "1.0.4"),
      reason: "Install 1.0.5 by hand first",
      note: currentVersion(device) === "1.0.4"
        ? "It runs 1.0.4, which only accepts signed updates. Install 1.0.5 by hand, then add it."
        : `Version is ${currentVersion(device) ?? "unknown"}.`,
    },
  ];
}

/** The first failing check, or null when the device can be ticked. */
export function pilotBlocker(device: FleetDevice): PilotBlocker | null {
  const failed = pilotChecks(device).find((item) => item.status === "fail");
  return failed ? { reason: failed.reason, detail: failed.note } : null;
}

/** Counts the version strings exactly as reported, so `1.0` and `1.0.0.0` count apart. Largest group first. */
export function countVersions(devices: FleetDevice[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const device of devices) {
    const key = resolveVersion(device)?.version ?? "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

// ponytail: fixed Asia/Bangkok so server and client render the same text; use the viewer's zone if users span zones.
const TIME = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", hourCycle: "h23", timeZone: "Asia/Bangkok" });
export const formatTime = (value: string | null | undefined) => (value ? TIME.format(new Date(value)) : "Never");
