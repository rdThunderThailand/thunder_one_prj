/** Run: node src/features/playlists/status-display.check.mts */
import assert from "node:assert/strict";
import { describeDeleteError, playlistDisplayStatus, statusBadge } from "./status-display.ts";

assert.deepEqual(statusBadge("active"), { color: "green", label: "Active" });
assert.deepEqual(statusBadge("draft"), { color: "yellow", label: "Draft" });
assert.deepEqual(statusBadge("inactive"), { color: "zinc", label: "Inactive" });

// A draft stays a draft however many publications point at it — the stored status is
// still the only thing that decides draft / not-draft.
assert.equal(playlistDisplayStatus({ status: "draft", publication_count: 3 }), "draft");
// Nobody references it: inactive, whatever the (untrustworthy) stored value says.
assert.equal(playlistDisplayStatus({ status: "active", publication_count: 0 }), "inactive");
// Referenced: active, even on a row someone archived by hand before ADR 0028.
assert.equal(playlistDisplayStatus({ status: "inactive", publication_count: 3 }), "active");
// No count at all — a frontend deployed ahead of Thunder_Core 098 keeps the stored
// value rather than declaring every playlist inactive.
assert.equal(playlistDisplayStatus({ status: "active" }), "active");
assert.equal(playlistDisplayStatus({ status: "inactive" }), "inactive");

// The count survives; the raw RPC wording does not.
assert.equal(
  describeDeleteError("Invalid input: playlist is used by 3 publication(s)"),
  "ลบไม่ได้ — playlist นี้ถูกใช้อยู่ใน 3 publication กรุณาลบหรือยกเลิก publication เหล่านั้นก่อน"
);
assert.match(
  describeDeleteError("Invalid input: this playlist belongs to a publication and cannot be deleted on its own"),
  /ลบที่ publication แทน$/
);
// Anything unrecognised degrades to a generic retry message rather than leaking the body.
assert.equal(describeDeleteError("permission denied for table playlists"), "ลบ playlist ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");

console.log("status-display.check.mts — all assertions passed");
