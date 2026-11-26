/**
 * Runnable check for the schedule primitives:
 *
 *     node src/features/media-workspace/publications/schedule.check.mts
 *
 * ponytail: node:assert plus Node's native TS stripping, so this repo needs no
 * test runner. If vitest ever lands, rename to *.test.ts and wrap in it()/expect().
 *
 * Nothing imports this file, so it never reaches a bundle. `.mts` marks it ESM;
 * Node still warns about the typeless package.json when it loads schedule.ts,
 * which is cosmetic — adding "type": "module" would break the Next build.
 */
import assert from "node:assert/strict";
// Explicit .ts extension: Node's ESM resolver does no extension guessing. Needs
// allowImportingTsExtensions in tsconfig, which is safe here (noEmit).
import { getDayTimelinePlacement } from "./schedule.ts";

assert.deepEqual(getDayTimelinePlacement("16:00", "19:00"), {
  leftPercent: 66.6667,
  widthPercent: 12.5,
});
assert.deepEqual(getDayTimelinePlacement("22:00", "02:00"), {
  leftPercent: 91.6667,
  widthPercent: 8.3333,
});

console.log("schedule.check.mts — all assertions passed");
