/**
 * Runnable check for the Now & Next row helpers:
 *
 *     node src/features/media-workspace/publications/now-next-view.check.mts
 */
import assert from "node:assert/strict";
import { contentHref, editProgramHref, elapsedPercent, formatRemaining, nextEntry, rowStatus } from "./now-next-view.ts";
import type { NowNextOccurrence, NowNextRow } from "./now-next.ts";

const pub = (id: string) => ({ id, name: id, publication_type: "composition", content_name: null, content: { kind: "layout" as const, id: null, name: null } });
const occ = (over: Partial<NowNextOccurrence> = {}): NowNextOccurrence => ({
  occurrence_id: "o", opens_at: "2026-10-06T10:00:00Z", closes_at: "2026-10-06T11:00:00Z", remaining_seconds: 1800, priority: "normal",
  output_kind: "publication", publications: [pub("p1")], scheduled_now: true, playback_state: "confirmed", suppressed: [], ...over,
});
const row = (over: Partial<NowNextRow> = {}): NowNextRow => ({ row_type: "channel", channel: null, device: null, devices: [], current: null, upcoming: [], suppressed_count: 0, ...over });

assert.deepEqual(rowStatus(row({ current: occ() })), { label: "Live", tone: "success" });
assert.equal(rowStatus(row({ current: occ({ playback_state: "stale" }) })).label, "Playback stale");
assert.equal(rowStatus(row({ current: occ({ playback_state: "not_confirmed" }) })).label, "Scheduled");
assert.equal(rowStatus(row()).label, "Scheduled");

assert.equal(formatRemaining(null), "—");
assert.equal(formatRemaining(65), "1:05");
assert.equal(formatRemaining(3725), "1:02:05");
assert.equal(formatRemaining(-3), "0:00");

assert.equal(elapsedPercent(occ(), "2026-10-06T10:30:00Z"), 50);
assert.equal(elapsedPercent(occ(), "2026-10-06T12:00:00Z"), 100);
assert.equal(elapsedPercent(occ({ closes_at: null }), "2026-10-06T10:30:00Z"), null);

assert.equal(nextEntry(row({ current: occ({ closes_at: null }) }))?.kind, "continues");
assert.equal(nextEntry(row({ current: occ() })), null);
assert.equal(nextEntry(row({ current: occ({ closes_at: null }), upcoming: [occ()] }))?.kind, "next");
assert.equal(nextEntry(row()), null);

assert.equal(contentHref({ kind: "layout", id: "L1", name: "x" }), "/media-workspace/layouts/L1?preview=1");
assert.equal(contentHref({ kind: "playlist", id: "P1", name: "x" }), "/media-workspace/playlists/P1");
assert.equal(contentHref({ kind: "playlist", id: null, name: "x" }), null);
assert.equal(contentHref({ kind: "image", id: "I1", name: "x" }), null);

assert.equal(editProgramHref(row({ current: occ() }), "/media-workspace/now-next?group=g"), "/media-workspace/program/p1/edit?returnTo=%2Fmedia-workspace%2Fnow-next%3Fgroup%3Dg");
assert.equal(editProgramHref(row({ current: occ({ publications: [pub("a"), pub("b")] }) }), "/x"), null);
assert.equal(editProgramHref(row(), "/x"), null);
console.log("now-next-view.check: ok");
