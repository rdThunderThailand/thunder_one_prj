import assert from "node:assert/strict";
import { listViewportMetrics } from "./assignment-viewport-metrics.ts";
const normal = { viewportBottom: 900, top: 100, bottomPadding: 24, fixedHeight: 160,
  gaps: 36, cardChrome: 34, footer: 48, heading: 32, row: 64 };
assert.deepEqual(listViewportMetrics(normal), { height: 776, bounded: true });
assert.equal(listViewportMetrics({ ...normal, viewportBottom: 500 }).bounded, false);
assert.equal(listViewportMetrics({ ...normal, fixedHeight: 450, row: 100 }).bounded, false);
assert.equal(listViewportMetrics({ ...normal, viewportBottom: 50 }).height, 0);
// Existing scroll does not enter the pure geometry: the caller normalizes root.top.
assert.equal(listViewportMetrics({ ...normal, top: 100 }).height, 776);
console.log("List viewport geometry checks passed");
