/** Run: node src/features/media-workspace/playlists/status-display.check.mts */
import assert from "node:assert/strict";
import { describeDeleteError, describePermanentDeleteRefusal, playlistDisplayStatus, statusBadge } from "./status-display.ts";

assert.deepEqual(statusBadge("active"), { color: "green", label: "Active" });
assert.deepEqual(statusBadge("draft"), { color: "yellow", label: "Draft" });
assert.deepEqual(statusBadge("inactive"), { color: "zinc", label: "Inactive" });

// A draft stays a draft however many Programs play it — the stored status is
// still the only thing that decides draft / not-draft.
assert.equal(playlistDisplayStatus({ status: "draft", in_use_count: 3 }), "draft");
// No draft or active Program plays it: inactive, whatever the (untrustworthy) stored value says.
assert.equal(playlistDisplayStatus({ status: "active", in_use_count: 0 }), "inactive");
// In use (directly or through a Layout, ADR 0120): active, even on a row someone archived by hand.
assert.equal(playlistDisplayStatus({ status: "inactive", in_use_count: 3 }), "active");
// `publication_count` (direct, any status) no longer drives the badge: a playlist reached only
// through a Layout has 0 direct references and is still active.
// (Callers pass whole playlist objects, so the extra key is fine there; mirror that here.)
const viaLayout = { status: "active" as const, publication_count: 0, in_use_count: 1 };
assert.equal(playlistDisplayStatus(viaLayout), "active");
// No in_use_count at all — a frontend deployed ahead of Thunder_Core keeps the stored
// value rather than declaring every playlist inactive.
const noCount = { status: "active" as const, publication_count: 0 };
assert.equal(playlistDisplayStatus(noCount), "active");
assert.equal(playlistDisplayStatus({ status: "active" }), "active");
assert.equal(playlistDisplayStatus({ status: "inactive" }), "inactive");

// #40 wording: the publication names survive, the prefix does not.
assert.equal(
  describeDeleteError("Invalid input: playlist is used by an active or draft publication: Summer Sale, Lobby Loop"),
  "ย้ายลงถังไม่ได้ — playlist นี้ถูกใช้อยู่ใน publication ที่ active หรือ draft: Summer Sale, Lobby Loop กรุณายกเลิก publication เหล่านั้นก่อน"
);
// Legacy count wording still handled until every environment is on the #40 backend.
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

// media_video_delete (ADR 0045 §10), reached via the kind='single' cascade.
assert.equal(
  describeDeleteError("Already in use: video is still referenced by a playlist"),
  "ลบไม่ได้ — วิดีโอนี้ยังถูกใช้อยู่ใน playlist กรุณานำออกจาก playlist ก่อน"
);
assert.equal(
  describeDeleteError("Already in use: video has been published and is part of a broadcast history snapshot"),
  "ลบไม่ได้ — วิดีโอนี้เคย publish ไปแล้วจึงลบถาวรไม่ได้ ใช้ Archive แทน"
);

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
