import assert from "node:assert/strict";
import { readAssignmentHistoryQuery, assignmentHistoryQueryString, assignmentEventKey, assignmentHistoryDate,
  assignmentHistoryReason, assignmentHistoryRowNumber, assignmentEvidenceState, ASSIGNMENT_EVENT_LABEL } from "./assignment-history.ts";
import { assignmentEventsPageSchema, assignmentHistoryPageSchema } from "../services/asset-assignments-contract.ts";

const id = "c1111111-1111-1111-1111-111111111111";
assert.deepEqual(readAssignmentHistoryQuery({ tab: "history" }), { ok: true, tab: "history", query: { page: 1, pageSize: 20 }, filtered: false });
const parsed = readAssignmentHistoryQuery({ tab: "history", q: "  Laptop & display  ", event_type: "Assign",
  date_from: "2026-11-01", date_to: "2026-11-10", category_id: id, arbitrary: "not sent" });
assert.ok(parsed.ok);
if (parsed.ok) {
  assert.ok(parsed.filtered);
  const params = new URLSearchParams(assignmentHistoryQueryString(parsed.query));
  assert.deepEqual([...params.keys()].sort(), ["date_from", "date_to", "event_type", "page", "pageSize", "q"]);
  assert.equal(params.get("q"), "Laptop & display");
  assert.equal(params.get("event_type"), "Assign");
}
for (const input of [{ page: "0" }, { pageSize: "101" }, { q: "x".repeat(201) }, { event_type: "Assignment" },
  { event_type: ["Assign", "Return"] }, { date_from: "2026-02-30" }, { date_to: "invalid" },
  { date_from: "2026-11-10", date_to: "2026-11-01" }, { tab: "current" }, { tab: ["history", "current"] }]) {
  assert.equal(readAssignmentHistoryQuery(input).ok, false, JSON.stringify(input));
}
assert.equal(readAssignmentHistoryQuery({ date_from: "2026-11-10", date_to: "2026-11-10" }).ok, true);
assert.equal(readAssignmentHistoryQuery({ category_id: "invalid", custody_id: "invalid" }).ok, true);
assert.equal(ASSIGNMENT_EVENT_LABEL.Assign, "Assignment");
assert.deepEqual(assignmentHistoryDate("2026-11-09T18:30:00Z"), { date: "10 Nov 2026", time: "01:30" });
assert.deepEqual(assignmentHistoryDate("invalid"), { date: "—", time: "—" });
assert.equal(assignmentHistoryReason("backfill"), "—");
assert.equal(assignmentHistoryReason("A backfill correction"), "A backfill correction");
assert.equal(assignmentHistoryReason(null), "—");
assert.equal(assignmentHistoryRowNumber(3, 20, 0), 41);
const at = "2026-11-10T01:00:00Z";
const expiresAt = "2026-11-10T02:00:00Z";
assert.equal(assignmentEvidenceState("https://files.example/file", expiresAt, Date.parse(at)), "available");
assert.equal(assignmentEvidenceState(null, expiresAt, Date.parse(at)), "unavailable");
assert.equal(assignmentEvidenceState("https://files.example/file", expiresAt, Date.parse(expiresAt)), "expired");
const event = { id, action: "Assign", at, asset: { id, name: "Laptop", assetTag: "AST-001" }, from: null,
  to: { id, type: "person", name: "Owner", avatarUrl: null }, performedBy: null, condition: null,
  reason: "backfill", location: null, evidence: [] };
const page = { data: [event, { ...event, action: "Return", to: null }], page: 1, pageSize: 20, total: 2, totalPages: 1, expiresAt };
const result = assignmentHistoryPageSchema.parse(page);
assert.notEqual(assignmentEventKey(result.data[0]), assignmentEventKey(result.data[1]));
assert.equal(assignmentHistoryPageSchema.safeParse({ ...page, data: [event, event] }).success, false);
assert.equal(assignmentHistoryPageSchema.safeParse({ ...page, totalPages: 2 }).success, false);
assert.equal(assignmentHistoryPageSchema.safeParse({ ...page, expiresAt: undefined }).success, false);
const file = { fileId: id, filename: "handover.pdf", mimeType: "application/pdf", sizeBytes: 10, uploadedAt: at, url: null };
assert.equal(assignmentHistoryPageSchema.safeParse({ ...page, data: [{ ...event, evidence: [file] }] }).success, true);
assert.equal(assignmentHistoryPageSchema.safeParse({ ...page, data: [{ ...event, evidence: [{ ...file, url: "javascript:alert(1)" }] }] }).success, false);
// The short Recent-history payloads used by FE 02–04 still parse without the new fields.
assert.equal(assignmentEventsPageSchema.safeParse({ data: [{ id, action: "Assign", at, from: null, to: null, location: null }], total: 1 }).success, true);
console.log("History query, dates, labels, identity, evidence and Recent-history compatibility checks passed");
