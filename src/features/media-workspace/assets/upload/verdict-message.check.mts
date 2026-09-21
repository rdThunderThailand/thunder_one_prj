/**
 * Runnable check for the ADR 0070 verdict → sentence mapping:
 *
 *     node src/features/media-workspace/assets/upload/verdict-message.check.mts
 */
import assert from "node:assert/strict";
import { verdictMessage } from "./verdict-message.ts";

// --- unsupported_profile ---
{
  const message = verdictMessage({ code: "unsupported_profile", profile: "High" });
  assert.match(message!, /High Profile/);
  assert.match(message!, /cannot decode/);
}

// --- unreadable ---
{
  const message = verdictMessage({ code: "unreadable" });
  assert.match(message!, /could not be read/);
}

// --- unverified_preset ---
{
  const message = verdictMessage({ code: "unverified_preset", profile: "Main" });
  assert.match(message!, /Main Profile/);
  assert.match(message!, /not.*certified/);
}

// --- supported (Baseline, no message) ---
{
  assert.equal(verdictMessage({ code: "supported", profile: "Baseline" }), null);
}

// --- absent (pre-#65 Asset, or image) ---
{
  assert.equal(verdictMessage(undefined), null);
  assert.equal(verdictMessage(null), null);
}

console.log("verdict-message.check.mts: all checks passed");
