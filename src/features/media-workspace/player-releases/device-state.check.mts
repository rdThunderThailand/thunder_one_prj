// node device-state.check.mts
import assert from "node:assert/strict";
import { countVersions, isWindows, pilotBlocker, resolveVersion, type FleetDevice } from "./device-state.ts";

const base: FleetDevice = {
  id: "1", name: "d", tenant_id: "t", tenant_name: "T", registry_status: "registered", lifecycle_status: "ACTIVE",
  os_version: null, app_version: null, last_heartbeat_at: null, health: "offline", ring: null, active_channel: null,
  last_check: null, latest_report: null, reported_version: null,
};
const check = { app_version: "1.0.0", update_track: "windows-x64", update_install_mode: "windows_managed", os_version: null, checked_at: "x" };

// version order: report, then update-check, then device record
assert.deepEqual(resolveVersion({ ...base, app_version: "0.9" }), { version: "0.9", source: "device record" });
assert.deepEqual(resolveVersion({ ...base, app_version: "0.9", last_check: check }), { version: "1.0.0", source: "update check" });
assert.deepEqual(resolveVersion({ ...base, app_version: "0.9", last_check: check, reported_version: "1.0.1" }), { version: "1.0.1", source: "update report" });
assert.equal(resolveVersion(base), null);

// blockers
assert.equal(pilotBlocker(base), null);
assert.equal(pilotBlocker({ ...base, os_version: "Android 7" }), null, "OS alone never blocks");
assert.equal(pilotBlocker({ ...base, ring: "pilot" }), "Already in the test group");
assert.equal(pilotBlocker({ ...base, registry_status: "pending" }), "Not registered");
assert.equal(pilotBlocker({ ...base, lifecycle_status: "decommissioned" }), "Decommissioned");
assert.ok(pilotBlocker({ ...base, last_check: { ...check, update_track: "android" } })?.includes("android"));
assert.ok(pilotBlocker({ ...base, last_check: { ...check, update_install_mode: "unsupported" } })?.includes("unsupported"));
assert.equal(pilotBlocker({ ...base, last_check: check }), null);

// counts keep raw strings apart
const counted = countVersions([
  { ...base, app_version: "1.0" }, { ...base, app_version: "1.0.0.0" }, { ...base, app_version: "1.0" }, base,
]);
assert.deepEqual(counted, [["1.0", 2], ["1.0.0.0", 1], ["Unknown", 1]]);

assert.equal(isWindows({ ...base, os_version: "Windows 10 build 19045" }), true);
assert.equal(isWindows({ ...base, os_version: "Microsoft Windows 10.0.26200" }), true, "device profile wording");
assert.equal(isWindows({ ...base, os_version: "Android 7.1.2" }), false);
console.log("device-state ok");
