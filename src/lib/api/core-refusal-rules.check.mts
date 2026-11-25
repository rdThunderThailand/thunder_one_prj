/**
 * Fixtures for the Core refusal table (ADR 0126 §9):
 *
 *     node src/lib/api/core-refusal-rules.check.mts
 *
 * One fixture per rule, copied from a live definition on Core origin/main or origin/develop.
 */
import assert from "node:assert/strict";
import { ApiError, classifyApiError, type ClassifiedError } from "./api-error.ts";
import { CORE_REFUSAL_RULES, REFUSAL_PREFIXES } from "./core-refusal-rules.ts";

const FALLBACK = "Failed to save draft.";

// ADR 0126 §9: one fixture per table rule, the text copied from a live Core definition (both
// origin/main and origin/develop unless noted); the comment names the RPC and the migration file.
// B = 20261026235959_baseline_from_prod.sql. Asserts kind, reason, names, and that no lowercase
// English sentence of Core's survives in `message`.
type Expect = Partial<Pick<ClassifiedError, "kind" | "reason" | "names" | "part" | "cause">> & { has?: string; status?: number };
const fixtures: [string, Expect][] = [
  // media_publication_activate: native_canvas_size.sql (main), channel_tombstone_guards.sql (develop)
  ["Already active: publication is not a draft", { kind: "already-active", has: "Draft" }],
  // media_channel_activate: B
  ["Already active: channel is already active", { kind: "already-active", has: "Channel" }],
  // media_composition_upsert / media_composition_set_zones (what_holds_a_playlist.sql) / media_composition_fork_layout
  ["Already modified: composition was changed elsewhere", { kind: "conflict", has: "Layout นี้ถูกแก้ไข" }],
  // media_publication_upsert (draft_patch_keeps_omitted_fields.sql on develop), media_playlist_upsert: B
  ["Already modified: draft was changed elsewhere", { kind: "conflict", has: "โหลดหน้านี้ใหม่" }],
  // media_publication_update_published: B
  ["Already modified: this program was changed elsewhere — reload to see the latest", { kind: "conflict", has: "โหลดหน้านี้ใหม่" }],
  // media_core.channel_lock: B (main) / channel_tombstone_guards.sql (develop)
  ["Already modified: channel was changed elsewhere", { kind: "conflict", has: "โหลดหน้านี้ใหม่" }],
  // media_layout_upsert: B
  ['Already exists: a layout named "T25 Layout" exists', { kind: "rejected", reason: "duplicate-name", has: "Template" }],
  // media_composition_upsert: B, media_composition_duplicate: layout_copies_keep_canvas_mode.sql
  ['Already exists: a composition named "Menu" exists', { kind: "rejected", reason: "duplicate-name", has: "Layout" }],
  // media_composition_restore: B
  ['Already exists: no free name for restored composition "Menu"', { kind: "rejected", has: "กู้คืน Layout ไม่ได้" }],
  // media_channel_create / media_channel_update (channel_delete_unused.sql), media_channel_groups_create / _update: B
  ["Already exists: a channel named Foo already exists", { kind: "rejected", reason: "duplicate-name", has: "มี Channel ชื่อนี้อยู่แล้ว" }],
  ["Already exists: a channel group named Foo already exists", { kind: "rejected", reason: "duplicate-name", has: "มี Channel Group ชื่อนี้อยู่แล้ว" }],
  // media_composition_set_zones: what_holds_a_playlist.sql. Ahead of the publish cause "zones-unbound".
  [
    "Invalid input: cannot leave an active composition incomplete — zone(s) Main, Side are unbound",
    { kind: "rejected", cause: undefined, has: "บันทึกไม่ได้ — Layout ที่ Active อยู่ต้องผูก Content ให้ครบทุก Zone ยังไม่ได้ผูก: Main, Side" },
  ],
  // media_publication_update_published: B:10535. Stays without `schedule-ended`.
  [
    "Invalid input: [schedule] end time is in the past — use End program instead",
    { kind: "rejected", part: "schedule", cause: undefined, has: "End program" },
  ],
  // media_publication_upsert / _set_content / _set_schedule: B
  ["Invalid input: only draft publications can be edited", { kind: "rejected", reason: "stale-draft", has: "ไม่ใช่ Draft" }],
  ["Invalid input: [details] only draft publications can be edited", { kind: "rejected", reason: "stale-draft", part: "details" }],
  // ~13 RPCs (activate, cancel, delete, get, republish, upsert …): keeps today's 404 line, adds `reason` only
  ["not found: publication not found for this tenant", { kind: "not-found", reason: "stale-draft", has: "ไม่พบเนื้อหานี้", status: 404 }],
  // media_publication_update_published: B
  ["Invalid input: [content] html and dynamic content cannot be edited here", { kind: "rejected", part: "content", has: "HTML" }],
  ["Invalid input: [content] at least one media asset is required", { kind: "rejected", part: "content", has: "ยังไม่ได้เลือกสื่อ" }],
  ["not found: [content] playlist not found for this tenant", { kind: "not-found", part: "content", cause: undefined, has: "ยังไม่ได้เลือกเนื้อหา", status: 404 }],
  ["not found: [content] composition not found for this tenant", { kind: "rejected", part: "content", cause: "no-content", status: 404 }],
  ["not found: [targets] screen D1 not found for this tenant", { kind: "not-found", part: "targets", has: "ไม่พบจอที่เลือก", status: 404 }],
  ["not found: [targets] channel C1 not found for this tenant", { kind: "rejected", part: "targets", cause: "targets", status: 404 }],
  ["Invalid input: [targets] duplicate target — the same channel, screen or group is listed twice", { kind: "rejected", part: "targets", has: "เลือกปลายทางซ้ำกัน" }],
  // media_playlist_delete: playlist_in_use_via_layout.sql
  [
    "Invalid input: playlist is used by an active or draft publication: Summer Sale, Lobby Loop",
    { kind: "rejected", has: "Program ที่ Active หรือ Draft: Summer Sale, Lobby Loop" },
  ],
  ["Invalid input: this playlist belongs to a publication and cannot be deleted on its own", { kind: "rejected", has: "ลบที่ Program แทน" }],
  // media_layout_upsert: B
  ["Invalid input: zones 1 and 3 overlap", { kind: "rejected", has: "Zone ลำดับที่ 1 และ 3 ซ้อนทับกัน" }],
  ["Invalid input: a layout needs at least one zone", { kind: "rejected", has: "ต้องมีอย่างน้อย 1 Zone" }],
  ["Invalid input: zone is used by composition(s) Lobby, Menu", { kind: "rejected", has: "ยังถูกใช้ใน: Lobby, Menu" }],
  // media_composition_set_zones: what_holds_a_playlist.sql
  ["Invalid input: playlist is in Trash: Summer Loop", { kind: "rejected", has: "Playlist Summer Loop อยู่ในถังขยะ" }],
  // media_composition_upsert: B
  ["Invalid input: cannot change the layout of an active composition", { kind: "rejected", has: "เปลี่ยน Template ไม่ได้" }],
  // media_composition_set_status: B
  ["Invalid input: cannot move a composition back to draft", { kind: "rejected", has: "ย้าย Layout กลับไป Draft ไม่ได้" }],
  // Channels and Channel Groups (#460 PR 2). `Already active:`/`Already exists:` rows are above.
  // media_core.channel_set_devices (via media_channel_update / _create): B:790
  [
    "Already in use: cannot remove Player 01 while these publications target this channel: Summer Sale",
    { kind: "rejected", has: "เปลี่ยน Player ไม่ได้" },
  ],
  // media_core.channel_validate (via media_channel_create / _update): B:895 and B:907
  [
    "Invalid input: this player reports a different orientation than the channel expects, confirm to continue: portrait",
    { kind: "rejected", reason: "needs-confirm", has: "ยืนยันอีกครั้ง" },
  ],
  [
    "Invalid input: these devices report a different resolution than the channel expects, confirm to continue: 1280x720",
    { kind: "rejected", reason: "needs-confirm", has: "ยืนยันอีกครั้ง" },
  ],
  // media_channel_delete: channel_delete_unused.sql:178 (main), channel_tombstone.sql:36 (develop)
  [
    "Invalid input: remove this channel from its groups before deleting: Lobby, Cafe",
    { kind: "rejected", has: "ยังอยู่ใน Group: Lobby, Cafe" },
  ],
  // media_channel_delete (channel_delete_unused.sql:183 main, channel_tombstone.sql:41 develop) and
  // media_channel_deactivate (B:5034): one verb-free line for both
  [
    "Already in use: these publications still target this channel: Summer Sale",
    { kind: "rejected", has: "ยังมี Program ใช้ Channel นี้อยู่: Summer Sale" },
  ],
  // media_channel_delete: channel_delete_unused.sql:190 (main only; develop's channel_tombstone.sql no longer raises it)
  [
    "Already in use: this channel has Program or playback history and cannot be deleted yet",
    { kind: "rejected", has: "ปิดใช้งานแทน" },
  ],
  // media_channel_groups_delete: B:5175
  [
    "Already in use: remove this group from these publications first: Promo A, Promo B",
    { kind: "rejected", has: "ยังถูกใช้ใน Program: Promo A, Promo B" },
  ],
  // The sync-group conflict, five raises (all one rule): media_channel_groups_set_members B:5267 / B:5281
  // (develop channel_tombstone_guards.sql:703 / :717), media_channel_groups_update B:5339,
  // media_channel_set_groups B:5467 / B:5480 (develop channel_tombstone_guards.sql:774 / :787)
  ['Invalid input: cannot add to synchronized group "Lobby", already synchronized elsewhere: Cafe', { kind: "rejected", has: "Group เดียว" }],
  ['Invalid input: cannot make "Lobby" synchronized, already synchronized elsewhere: Cafe', { kind: "rejected", has: "Group เดียว" }],
  ["Invalid input: a channel in this selection is already in another synchronized group", { kind: "rejected", has: "Group เดียว" }],
  ["Invalid input: this channel is already in another synchronized group", { kind: "rejected", has: "Group เดียว" }],
  ["Invalid input: a channel may belong to only one synchronized group, selected: Lobby, Cafe", { kind: "rejected", has: "Group เดียว" }],
  // media_core.publish_changes_apply (B:1809) wraps the inner message of media_publication_republish
  [
    'Invalid input: program "Lobby Loop" — Invalid input: composition is not active — activate it before publishing',
    { kind: "rejected", reason: "program-refused", names: ["Lobby Loop"], cause: "layout-not-active", has: "Layout ที่เลือกยังไม่ Active" },
  ],
  [
    'Invalid input: program "Lobby Loop" — Invalid input: cannot activate an incomplete composition — zone(s) Main are unbound',
    { reason: "program-refused", names: ["Lobby Loop"], cause: "zones-unbound", has: "ผูก Content ให้ครบทุก Zone" },
  ],
  [
    'Invalid input: program "Lobby Loop" — Invalid input: cannot activate — replace this file: A.mp4; wait — conversion in flight: B.mp4',
    { reason: "program-refused", names: ["Lobby Loop"], cause: "files", has: "ไฟล์กำลังแปลง (B.mp4)" },
  ],
  [
    'Invalid input: program "Lobby Loop" — Invalid input: publication is a draft — activate it instead of re-publishing',
    { kind: "rejected", reason: "program-refused", names: ["Lobby Loop"], has: "ไม่ผ่านเงื่อนไขการ Publish" },
  ],
];
for (const [core, want] of fixtures) {
  const got = classifyApiError(new ApiError(core, want.status ?? 400), FALLBACK);
  for (const key of ["kind", "reason", "part", "cause"] as const) {
    if (key in want) assert.equal(got[key], want[key], `${core}: ${key}`);
  }
  if (want.names) assert.deepEqual(got.names, want.names, core);
  else assert.equal(got.names, undefined, core);
  if (want.has) assert.ok(got.message.includes(want.has), `${core}: ${got.message}`);
  assert.ok(/[฀-๿]/.test(got.message), `${core} should be Thai`);
  assert.ok(!/\b[a-z]{2,}(?: [a-z]{2,}){2,}\b/.test(got.message), `${core} leaked English: ${got.message}`);
}
// The same Core text on a screen that is not the Program edit keeps its generic wording.
assert.equal(classifyApiError(new ApiError("not found: playlist not found for this tenant", 404), FALLBACK).kind, "not-found");
assert.equal(classifyApiError(new ApiError("not found: playlist not found for this tenant", 404), FALLBACK).message, "ไม่พบเนื้อหานี้ อาจถูกลบไปแล้วหรือลิงก์ไม่ถูกต้อง");
// A raw activate refusal with no tag still names `schedule-ended`, and a tagged Core `[schedule]` keeps its part.
assert.equal(classifyApiError(new ApiError("Invalid input: [schedule] end time is in the past", 400), FALLBACK).cause, "schedule-ended");
assert.equal(classifyApiError(new ApiError("Invalid input: [publish] [schedule] end time is in the past", 400), FALLBACK).cause, "schedule-ended");
// A tagged refusal no rule names is the generic line, still bound to its part; a wrapper-less Publish changes failure is not "program-refused".
const generic = classifyApiError(new ApiError("Invalid input: [details] name is required", 400), FALLBACK);
assert.equal(generic.part, "details");
assert.equal(generic.message, "ข้อมูลที่กรอกยังไม่ครบหรือไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่");
assert.equal(classifyApiError(new ApiError("Invalid input: x", 400), FALLBACK).message, generic.message);
for (const [status, kind] of [[403, "forbidden"], [404, "not-found"]] as const) {
  const c = classifyApiError(new ApiError("HTTP", status), "Publish ไม่สำเร็จ");
  assert.equal(c.kind, kind);
  assert.equal(c.reason, undefined);
}
assert.equal(classifyApiError(new ApiError("HTTP Error 500", 500), "Publish ไม่สำเร็จ").message, "Publish ไม่สำเร็จ");

// Every rule is bound to one of the six prefixes `callMedia` forwards, and needs no free substring.
assert.equal(REFUSAL_PREFIXES.length, 6);
for (const rule of CORE_REFUSAL_RULES) assert.ok((REFUSAL_PREFIXES as readonly string[]).includes(rule.prefix), String(rule.match));

console.log("core-refusal-rules.check.mts — all assertions passed");
