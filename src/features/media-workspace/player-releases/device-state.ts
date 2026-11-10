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

export const osOf = (device: FleetDevice) => device.last_check?.os_version ?? device.os_version;

export const isWindows = (device: FleetDevice) => /windows/i.test(osOf(device) ?? "");

/**
 * Why a device cannot be ticked, or null. A One guard only: Core accepts any Media Device. Without an update-check the
 * OS is a hint and never blocks, because update-check eligibility rests on install mode and track (Decision 9).
 */
export function pilotBlocker(device: FleetDevice): string | null {
  if (device.ring) return "Already in the test group";
  if (device.registry_status !== "registered") return "Not registered";
  if (device.lifecycle_status && RETIRED.has(device.lifecycle_status.toUpperCase())) return "Decommissioned";
  const check = device.last_check;
  if (check && check.update_track !== "windows-x64") return `Updates ${check.update_track}, not windows-x64`;
  if (check && check.update_install_mode !== "windows_managed") return `Install mode ${check.update_install_mode}`;
  return null;
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
