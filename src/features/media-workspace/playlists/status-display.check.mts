/** Run: node src/features/media-workspace/playlists/status-display.check.mts */
import assert from "node:assert/strict";
import { describePermanentDeleteRefusal, playlistDisplayStatus, playlistInUseLabel, statusBadge } from "./status-display.ts";

assert.deepEqual(statusBadge("active"), { color: "green", label: "Active" });
assert.deepEqual(statusBadge("draft"), { color: "zinc", label: "Draft" });
assert.deepEqual(statusBadge("inactive"), { color: "zinc", label: "Inactive" });

// ADR 0125: Draft or Active only; use (`in_use_count`) never changes the badge.
assert.equal(playlistDisplayStatus({ status: "draft" }), "draft");
assert.equal(playlistDisplayStatus({ status: "active" }), "active");
// A stored `inactive` row (no frontend caller writes it) displays as Active.
assert.equal(playlistDisplayStatus({ status: "inactive" }), "active");
// Callers pass whole playlist objects, so extra keys are fine; mirror that here.
assert.equal(playlistDisplayStatus({ status: "active", in_use_count: 0 } as { status: "active" }), "active");
assert.equal(playlistDisplayStatus({ status: "draft", in_use_count: 3 } as { status: "draft" }), "draft");

// The in-use tag shows only for a positive count; 0 and a missing count show none.
assert.equal(playlistInUseLabel({ in_use_count: 3 }), "ใช้ใน 3 Program");
assert.equal(playlistInUseLabel({ in_use_count: 0 }), null);
assert.equal(playlistInUseLabel({}), null);

// ADR 0121: permanent delete names what holds the playlist.
assert.equal(
  describePermanentDeleteRefusal({ reason: "published" }),
  "ลบถาวรไม่ได้ — playlist นี้เคยถูก publish จึงถูกล็อกไว้ถาวร"
);
assert.equal(
  describePermanentDeleteRefusal({ reason: "in_layout", layouts: [{ id: "1", name: "Lobby", in_trash: false }] }),
  "ลบถาวรไม่ได้ — playlist นี้ยังอยู่ใน Layout: Lobby เอาออกจาก Layout ก่อน"
);
assert.equal(
  describePermanentDeleteRefusal({
    reason: "in_layout",
    layouts: [
      { id: "1", name: "Lobby", in_trash: false },
      { id: "2", name: "Menu", in_trash: false },
    ],
  }),
  "ลบถาวรไม่ได้ — playlist นี้ยังอยู่ใน Layout: Lobby, Menu เอาออกจาก Layout ก่อน"
);
// A trashed Layout must be restored first; mixed with a live one only the trashed one is flagged.
assert.equal(
  describePermanentDeleteRefusal({
    reason: "in_layout",
    layouts: [
      { id: "1", name: "Lobby", in_trash: false },
      { id: "2", name: "Menu", in_trash: true },
    ],
  }),
  "ลบถาวรไม่ได้ — playlist นี้ยังอยู่ใน Layout: Lobby, Menu (ในถังขยะ — กู้คืน Layout ก่อน) เอาออกจาก Layout ก่อน"
);
// Unknown or missing reason degrades to a generic line.
assert.equal(describePermanentDeleteRefusal({}), "ลบถาวรไม่ได้ กรุณาลองใหม่อีกครั้ง");
assert.equal(describePermanentDeleteRefusal({ reason: "in_layout" }), "ลบถาวรไม่ได้ กรุณาลองใหม่อีกครั้ง");

console.log("status-display.check.mts — all assertions passed");
