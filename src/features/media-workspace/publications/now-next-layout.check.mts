import assert from "node:assert/strict";
import { timelinePosition, timelineTicks, timelineWindow } from "./now-next-layout.ts";

const asOf = "2026-08-30T10:30:00.000Z";
const window = timelineWindow(asOf, 60);
assert.equal(window.current - window.start, 0);
assert.equal(timelineTicks(asOf, 60).length, 5);
assert.deepEqual(timelinePosition("2026-08-30T10:20:00.000Z", "2026-08-30T10:40:00.000Z", asOf, 60), { left: 0, width: 16.666666666666664 });
assert.equal(timelinePosition("2026-08-30T11:00:00.000Z", null, asOf, 60).width, 50);

const offset = timelineTicks("2026-08-30T10:37:00.000Z", 60);
assert.deepEqual(offset.map((tick) => tick.slice(11, 16)), ["10:30", "10:45", "11:00", "11:15", "11:30", "11:45"]);

console.log("now-next layout checks passed");
