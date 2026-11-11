// node rollout-device-status.check.mts
import assert from "node:assert/strict";
import type { FleetDevice } from "./device-state.ts";
import { countStatuses, progressOf, rolloutOf, type RolloutTarget } from "./rollout-device-status.ts";

const base: FleetDevice = {
  id: "1", name: "d", tenant_id: "t", tenant_name: "T", registry_status: "registered", lifecycle_status: "ACTIVE",
  os_version: null, app_version: null, last_heartbeat_at: null, health: "online", ring: null, active_channel: null,
  last_check: { app_version: "1.0.4", update_track: "windows-x64", update_install_mode: "windows_managed", os_version: null, checked_at: "x" },
  latest_report: null, reported_version: null, is_recent_check: true, production_outcome: null, target_report: null,
};
const target: RolloutTarget = { version: "1.0.5", isPaused: false };
const status = (change: Partial<FleetDevice>, t = target) => rolloutOf({ ...base, ...change }, t).status;

assert.equal(status({}), "waiting");
assert.equal(status({ ring: "pilot", production_outcome: "healthy" }), "test_group");
assert.equal(status({ production_outcome: "healthy" }), "updated");
assert.equal(status({ production_outcome: "in_flight" }), "updating");
assert.equal(status({ production_outcome: "unsupported" }), "unsupported");
assert.equal(status({}, { version: null, isPaused: false }), "no_version");

// the outcome beats a stale check, a changed track and a missing check (the stop rule counts these devices)
assert.equal(status({ production_outcome: "timed_out", is_recent_check: false }), "timed_out");
assert.equal(status({ production_outcome: "failed", last_check: { ...base.last_check!, update_track: "android" } }), "failed");
assert.equal(status({ production_outcome: "healthy", last_check: null, is_recent_check: null }), "updated");

// eligibility is the update-check rule only: registration and decommission do not change the status
assert.equal(status({ registry_status: "pending", lifecycle_status: "DECOMMISSIONED" }), "waiting");
assert.match(rolloutOf({ ...base, last_check: { ...base.last_check!, update_install_mode: "manual" } }, target).label, /Not eligible: install mode manual/);
assert.match(rolloutOf({ ...base, last_check: { ...base.last_check!, update_track: "android" } }, target).label, /updates android/);

assert.equal(status({ last_check: null, is_recent_check: null }), "no_check");
assert.equal(status({ is_recent_check: false }), "no_check");
assert.equal(status({ last_check: { ...base.last_check!, app_version: "1.0.5" } }), "on_version");
assert.equal(status({ last_check: { ...base.last_check!, app_version: "1.0.10" } }), "on_version", "compared by parts, not as text");
assert.equal(status({ last_check: { ...base.last_check!, app_version: "1.0.4.0" } }, { version: "1.0.4", isPaused: false }), "on_version");
assert.equal(status({ last_check: { ...base.last_check!, app_version: "1.0.9" } }, { version: "1.0.10", isPaused: false }), "waiting");

// paused target relabels the two statuses that would otherwise look like they wait for a slot
const paused = { version: "1.0.5", isPaused: true };
assert.equal(rolloutOf(base, paused).label, "Paused");
assert.equal(rolloutOf({ ...base, production_outcome: "in_flight" }, paused).label, "Paused");
assert.equal(rolloutOf({ ...base, production_outcome: "failed" }, paused).label, "Failed");

// progress: only an updating device follows its report; a download failure is a retry
const updating = (target_report: FleetDevice["target_report"]) => {
  const device = { ...base, production_outcome: "in_flight" as const, target_report };
  return progressOf(device, rolloutOf(device, target));
};
const report = (state: string, error_stage: string | null = null) => ({ state, error_stage, error_code: null, received_at: "x" });
assert.deepEqual(updating(null), { step: 0, total: 6, tone: "primary", label: "Offered" });
assert.equal(updating(report("downloading"))?.step, 2);
assert.equal(updating(report("started"))?.step, 6);
assert.equal(updating(report("failed", "download"))?.label, "Downloading");
assert.equal(updating(report("failed", "download"))?.tone, "primary");
assert.equal(updating(report("awaiting_user_action"))?.tone, "warning");
assert.equal(updating(report("revoked"))?.tone, "error");
assert.equal(progressOf(base, rolloutOf(base, target)), null, "a waiting device has no bar");
const healthy = { ...base, production_outcome: "healthy" as const, target_report: report("installing") };
assert.equal(progressOf(healthy, rolloutOf(healthy, target))?.step, 6, "healthy by version is a full bar even with an old installing report");

// the summary counts come from the same helper
const counts = countStatuses([base, { ...base, production_outcome: "failed" }, { ...base, ring: "pilot" }], target);
assert.equal(counts.waiting, 1);
assert.equal(counts.failed, 1);
assert.equal(counts.test_group, 1);
console.log("rollout-device-status ok");
