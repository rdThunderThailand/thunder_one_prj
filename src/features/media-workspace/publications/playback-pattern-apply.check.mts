/**
 * Runnable check for the Playback Pattern Apply decision (ADR 0083):
 *
 *     node src/features/media-workspace/publications/playback-pattern-apply.check.mts
 *
 * ponytail: node:assert with recording stubs; the function is React-free like next-transition.ts.
 */
import assert from "node:assert/strict";
import { applyPlaybackPattern } from "./playback-pattern-apply.ts";

function run(opts: { count?: number | Error; confirmAnswer?: boolean; writeFails?: boolean }) {
  const calls = { fetches: 0, confirmedWith: [] as number[], writes: 0 };
  const outcome = applyPlaybackPattern({
    fetchCount: async () => {
      calls.fetches += 1;
      if (opts.count instanceof Error) throw opts.count;
      return opts.count ?? 0;
    },
    confirm: async (count) => {
      calls.confirmedWith.push(count);
      return opts.confirmAnswer ?? true;
    },
    write: async () => {
      calls.writes += 1;
      if (opts.writeFails) throw new Error("boom");
    },
  });
  return { outcome, calls };
}

// No other active/scheduled Program: written without asking.
{
  const { outcome, calls } = run({ count: 0 });
  assert.deepEqual(await outcome, { kind: "saved" });
  assert.equal(calls.writes, 1);
  assert.deepEqual(calls.confirmedWith, []);
}

// Used by other Programs and confirmed: the dialog gets the FRESH count, then the write happens.
{
  const { outcome, calls } = run({ count: 3, confirmAnswer: true });
  assert.deepEqual(await outcome, { kind: "saved" });
  assert.deepEqual(calls.confirmedWith, [3]);
  assert.equal(calls.writes, 1);
}

// Cancel: nothing is written.
{
  const { outcome, calls } = run({ count: 3, confirmAnswer: false });
  assert.deepEqual(await outcome, { kind: "cancelled" });
  assert.equal(calls.writes, 0);
}

// The count request fails: refuse to write rather than treat "unknown" as 0.
{
  const { outcome, calls } = run({ count: new Error("offline") });
  assert.deepEqual(await outcome, { kind: "count-failed" });
  assert.equal(calls.writes, 0);
  assert.deepEqual(calls.confirmedWith, []);
}

// The write fails: reported so the caller can keep the selection for a retry.
{
  const { outcome } = run({ count: 0, writeFails: true });
  assert.deepEqual(await outcome, { kind: "save-failed" });
}

console.log("playback-pattern-apply.check.mts — all assertions passed");
