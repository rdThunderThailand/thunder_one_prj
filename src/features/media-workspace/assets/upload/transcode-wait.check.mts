import assert from "node:assert/strict";
import { transcodeWaitMessage } from "./transcode-wait.ts";

const status = (patch: object) => ({
  asset_id: "a",
  status: "processing",
  job_status: null,
  queue_position: null,
  progress_pct: null,
  estimated_start_seconds: null,
  ...patch,
});

assert.equal(transcodeWaitMessage(undefined, "th"), null, "nothing until Core answers");
assert.equal(transcodeWaitMessage(status({}), "en"), null, "no open job");
assert.equal(
  transcodeWaitMessage(status({ job_status: "queued", queue_position: 3, estimated_start_seconds: 180 }), "th"),
  "คิวที่ 3 · เริ่มแปลงในอีกประมาณ 3 นาที",
);
assert.equal(
  transcodeWaitMessage(status({ job_status: "queued", queue_position: 1, estimated_start_seconds: 60 }), "en"),
  "Queue position 1 · starts in about 1 min",
);
assert.equal(transcodeWaitMessage(status({ job_status: "running", progress_pct: 42 }), "en"), "Converting 42%");
assert.equal(transcodeWaitMessage(status({ job_status: "running", progress_pct: 0 }), "th"), "กำลังแปลงไฟล์ 0%", "0 is a value");
assert.equal(transcodeWaitMessage(status({ job_status: "running" }), "th"), "กำลังแปลงไฟล์");

console.log("transcode-wait: all checks passed");
