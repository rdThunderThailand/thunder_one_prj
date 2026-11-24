/**
 * Runnable check for the status + verdict -> Playback Readiness mapping and its two languages:
 *
 *     node src/features/media-workspace/assets/upload/playback-readiness.check.mts
 */
import assert from "node:assert/strict";
import { isRefusal, playbackReadiness, readinessMessage, readinessTone } from "./playback-readiness.ts";

const verdict = (code: "supported" | "unverified_preset" | "unsupported_profile" | "unreadable") => ({ code, profile: "x" });

// --- ready: Baseline, Main, and a converted Asset re-registered with its source verdict ---
for (const code of ["supported", "unverified_preset", "unsupported_profile"] as const) {
  assert.equal(playbackReadiness({ status: "ready", probe_verdict: verdict(code) }), "ready", `ready + ${code}`);
}

// --- processing is waiting on a required conversion ---
assert.equal(playbackReadiness({ status: "processing", probe_verdict: verdict("unsupported_profile") }), "converting");

// --- failed is a refusal with the reason the verdict gives ---
assert.equal(playbackReadiness({ status: "failed", probe_verdict: verdict("unsupported_profile") }), "unsupported_profile");
assert.equal(playbackReadiness({ status: "failed", probe_verdict: verdict("unreadable") }), "unreadable");
assert.equal(playbackReadiness({ status: "failed", probe_verdict: null }), "refused", "failed with no verdict still refuses");
assert.equal(isRefusal("refused") && isRefusal("unreadable") && isRefusal("unsupported_profile"), true);
assert.equal(isRefusal("ready") || isRefusal("converting") || isRefusal(null), false);

// --- nothing to say ---
assert.equal(playbackReadiness({ status: "ready", probe_verdict: null }), null, "video registered before verdicts existed");
assert.equal(playbackReadiness({ status: "ready" }), null, "image upload: no verdict in the register response");
assert.equal(playbackReadiness({ kind: "image", status: "ready", probe_verdict: verdict("supported") }), null, "image kind");
assert.equal(playbackReadiness({ kind: "image", status: "processing" }), null);
assert.equal(playbackReadiness({ status: "ready", probe_verdict: verdict("unreadable") }), null);
assert.equal(playbackReadiness({ status: "pending", probe_verdict: verdict("supported") }), null, "unknown status");

// --- text: every code has both languages and none claims a conversion for a ready Asset ---
for (const code of ["ready", "converting", "unsupported_profile", "unreadable", "refused"] as const) {
  assert.ok(readinessMessage(code, "th").length > 0 && readinessMessage(code, "en").length > 0, code);
  assert.match(readinessMessage(code, "th"), /[ก-๙]/, `${code} th is Thai`);
  assert.doesNotMatch(readinessMessage(code, "en"), /[ก-๙]/, `${code} en is English`);
}
assert.doesNotMatch(readinessMessage("ready", "en"), /convert|certif/i);
assert.doesNotMatch(readinessMessage("ready", "th"), /แปลง|certif/i);

assert.deepEqual(
  (["ready", "converting", "unsupported_profile"] as const).map(readinessTone),
  ["neutral", "warning", "error"]
);

console.log("playback-readiness: all checks passed");
