// node device-state.check.mts
import assert from "node:assert/strict";
import { countVersions, currentVersion, isWindows, pilotBlocker, pilotChecks, resolveVersion, type FleetDevice } from "./device-state.ts";

const base: FleetDevice = {
  id: "1", name: "d", tenant_id: "t", tenant_name: "T", registry_status: "registered", lifecycle_status: "ACTIVE",
  os_version: null, app_version: null, last_heartbeat_at: null, health: "offline", ring: null, active_channel: null,
  last_check: null, latest_report: null, reported_version: null, is_recent_check: null, production_outcome: null, target_report: null,
};
const why = (device: FleetDevice) => pilotBlocker(device)?.reason ?? null;
const check = { app_version: "1.0.0", update_track: "windows-x64", update_install_mode: "windows_managed", os_version: null, checked_at: "2026-11-18T08:40:00Z" };

// version order: report, then update-check, then device record
assert.deepEqual(resolveVersion({ ...base, app_version: "0.9" }), { version: "0.9", source: "device record" });
assert.deepEqual(resolveVersion({ ...base, app_version: "0.9", last_check: check }), { version: "1.0.0", source: "update check" });
assert.deepEqual(resolveVersion({ ...base, app_version: "0.9", last_check: check, reported_version: "1.0.1" }), { version: "1.0.1", source: "update report" });
assert.equal(resolveVersion(base), null);

// blockers
assert.equal(why(base), null);
assert.equal(why({ ...base, os_version: "Android 7" }), null, "OS alone never blocks");
assert.equal(why({ ...base, ring: "pilot" }), "Already in the update group");
assert.equal(why({ ...base, registry_status: "unregistered", last_check: check }), "Unregistered");
assert.equal(why({ ...base, registry_status: "pending" }), "Never connected");
assert.equal(why({ ...base, registry_status: "pending", last_heartbeat_at: "x" }), null, "pending but heartbeating");
assert.equal(why({ ...base, registry_status: "pending", last_check: check }), null, "pending but checking");
assert.equal(why({ ...base, registry_status: "active" }), null, "active never blocks");
assert.equal(why({ ...base, lifecycle_status: "decommissioned" }), "Decommissioned");
assert.ok(why({ ...base, last_check: { ...check, update_track: "android" } })?.includes("android"));
assert.ok(pilotBlocker({ ...base, last_check: { ...check, update_track: "android" } })?.detail.includes("18 Nov 2026, 15:40"), "detail names the check time");
assert.ok(pilotBlocker({ ...base, registry_status: "pending" })?.detail.includes("pending"), "detail names the status");
assert.ok(why({ ...base, last_check: { ...check, update_install_mode: "unsupported" } })?.includes("unsupported"));
assert.equal(why({ ...base, last_check: check }), null);

// checklist: every guard listed once, the first failing one is the blocker
const states = (device: FleetDevice) => pilotChecks(device).map((item) => item.status).join();
assert.equal(states(base), "pass,pass,pass,pass,unknown,unknown,pass", "no update-check: track and mode are unknown");
assert.equal(states({ ...base, last_check: check }), "pass,pass,pass,pass,pass,pass,pass");
assert.equal(states({ ...base, registry_status: "pending" }), "pass,pass,fail,pass,unknown,unknown,pass");
assert.equal(states({ ...base, last_check: { ...check, update_track: "android", update_install_mode: "x" } }), "pass,pass,pass,pass,fail,fail,pass", "later failures still show");

// 1.0.4 needs a signature, so it is installed by hand first; the report's version never decides (amendment 5 item 6)
assert.equal(why({ ...base, app_version: "1.0.4" }), "Install 1.0.5 by hand first");
assert.equal(why({ ...base, last_check: { ...check, app_version: "1.0.4" } }), "Install 1.0.5 by hand first");
assert.equal(why({ ...base, app_version: "1.0.4", last_check: { ...check, app_version: "1.0.5" } }), null, "check wins over record");
assert.equal(why({ ...base, reported_version: "1.0.4", last_check: { ...check, app_version: "1.0.5" } }), null, "stale report is ignored");
assert.equal(currentVersion({ ...base, app_version: "0.9" }), "0.9");

// counts keep raw strings apart
const counted = countVersions([
  { ...base, app_version: "1.0" }, { ...base, app_version: "1.0.0.0" }, { ...base, app_version: "1.0" }, base,
]);
assert.deepEqual(counted, [["1.0", 2], ["1.0.0.0", 1], ["Unknown", 1]]);

assert.equal(isWindows({ ...base, os_version: "Windows 10 build 19045" }), true);
assert.equal(isWindows({ ...base, os_version: "Microsoft Windows 10.0.26200" }), true, "device profile wording");
assert.equal(isWindows({ ...base, os_version: "Android 7.1.2" }), false);
console.log("device-state ok");
