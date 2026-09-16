// Drives nextHistoryOp over whole interaction sequences, not one transition at a time.
// The previous version of this file tested the mode decision in isolation and passed while
// Back/Forward was broken in the browser: the mount bookkeeping lived inside the effect,
// where no check could reach it. Sequences are the unit that matters, so sequences are what
// this file asserts on.

import assert from "node:assert/strict";
import { nextHistoryOp, type SequencerState } from "./use-list-url-state.ts";

/** Replays a run of desired query strings the way the effect does, returning the ops issued
 *  and the resulting history stack (last element = the entry the user is standing on). */
function replay(initialQs: string, qsSequence: readonly string[]) {
  let current = initialQs;
  const entries = [initialQs];
  const ops: string[] = [];
  let state: SequencerState = { mounted: false, inSearchRun: false };

  for (const qs of qsSequence) {
    const result = nextHistoryOp(current, qs, state);
    state = result.state;
    ops.push(result.op);
    if (result.op === "skip") continue;
    if (result.op === "push") entries.push(qs);
    else entries[entries.length - 1] = qs;
    current = qs;
  }
  return { ops, entries };
}

// --- The bug this file exists to catch -------------------------------------------------
// Landing on a clean URL and changing one filter must leave a previous entry to go Back to.
// Before the fix this produced ["skip", "replace"] and zero new entries, so Back left the page.
{
  const { ops, entries } = replay("", ["", "status=active"]);
  assert.deepEqual(ops, ["skip", "push"], "first real change on a clean URL must push");
  assert.deepEqual(entries, ["", "status=active"], "the clean entry must survive for Back");
}

// Same guarantee when the page is entered with a filter already in the URL.
{
  const { ops, entries } = replay("status=active", ["status=active", "status=inactive"]);
  assert.deepEqual(ops, ["skip", "push"]);
  assert.deepEqual(entries, ["status=active", "status=inactive"]);
}

// A URL carrying junk/default params is normalized on mount without costing an entry.
{
  const { ops, entries } = replay("page=1", ["", "status=active"]);
  assert.deepEqual(ops, ["replace", "push"], "mount normalization replaces, never pushes");
  assert.deepEqual(entries, ["", "status=active"]);
}

// --- Search typing collapses into exactly one history step -----------------------------
{
  const { ops, entries } = replay("", ["", "q=b", "q=br", "q=bro", "q=brow"]);
  assert.deepEqual(ops, ["skip", "push", "replace", "replace", "replace"]);
  assert.deepEqual(entries, ["", "q=brow"], "Back once must reach the empty search box");
}

// A filter change ends the run, so the next typing run starts with its own push.
{
  const { ops, entries } = replay("", ["", "q=a", "q=ab", "status=active&q=ab", "status=active&q=abc"]);
  assert.deepEqual(ops, ["skip", "push", "replace", "push", "push"]);
  assert.deepEqual(entries, ["", "q=ab", "status=active&q=ab", "status=active&q=abc"]);
}

// page riding along with a query edit is still one search edit, not a separate step.
{
  const { ops } = replay("page=3", ["page=3", "q=a", "q=ab"]);
  assert.deepEqual(ops, ["skip", "push", "replace"]);
}

// An explicit page change is never a search edit.
{
  const { ops, entries } = replay("", ["", "page=2", "page=3"]);
  assert.deepEqual(ops, ["skip", "push", "push"]);
  assert.deepEqual(entries, ["", "page=2", "page=3"]);
}

// --- Sort transitions ------------------------------------------------------------------
{
  const { ops, entries } = replay("", ["", "sort=name&dir=asc", "sort=name&dir=desc"]);
  assert.deepEqual(ops, ["skip", "push", "push"]);
  assert.deepEqual(entries, ["", "sort=name&dir=asc", "sort=name&dir=desc"],
    "Back twice must walk back to the unsorted view");
}

// Returning to the default sort yields an empty query string, i.e. a clean pathname.
{
  const { ops, entries } = replay("", ["", "sort=name&dir=desc", ""]);
  assert.deepEqual(ops, ["skip", "push", "push"]);
  assert.equal(entries.at(-1), "", "clearing back to defaults must produce a clean URL");
}

// --- Idempotence: restoring state on popstate must not write history back ---------------
// restore() sets state from the URL, which re-runs the effect with a qs equal to the URL.
{
  const { ops } = replay("status=active", ["status=active"]);
  assert.deepEqual(ops, ["skip"], "a no-op transition must never touch history");
}

// Key order must not matter — writeListState builds params in a fixed order, but a URL the
// user pasted or an older entry may differ.
{
  const { op } = nextHistoryOp("dir=asc&sort=name", "sort=name&dir=asc", { mounted: true, inSearchRun: false });
  assert.equal(op, "push", "different key order with equal values is still a real transition");
}

console.log("use-list-url-state.check.mts: all assertions passed");
