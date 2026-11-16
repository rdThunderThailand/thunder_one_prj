// node src/features/asset-workspace/domain/warranty-form.check.mts
import assert from "node:assert/strict";
import {
  addWarrantyBody, draftFromRecord, emptyWarrantyDraft, updateWarrantyBody, warrantyErrors, warrantyNeedsReload,
} from "./warranty-form.ts";
import { addWarranty, setCurrentWarranty, updateWarranty, type WarrantyRequester } from "../services/warranty-write.ts";

const valid = { ...emptyWarrantyDraft(false), provider: " Acme ", type: "Extended", startDate: "2026-01-01", endDate: "2027-01-01" };
const clean = (draft: typeof valid) => Object.values(warrantyErrors(draft)).every((error) => error === null);

// Q16 default
assert.equal(emptyWarrantyDraft(false).makeCurrent, true);
assert.equal(emptyWarrantyDraft(true).makeCurrent, false);

// Validation
assert.ok(clean(valid));
assert.equal(warrantyErrors({ ...valid, provider: "  " }).provider, "Enter the provider.");
assert.equal(warrantyErrors({ ...valid, type: "x".repeat(251) }).type, "Enter 250 characters or fewer.");
assert.equal(warrantyErrors({ ...valid, endDate: "2025-12-31" }).endDate, "End Date can't be before Start Date.");
assert.ok(clean({ ...valid, endDate: "2026-01-01" }));
assert.equal(warrantyErrors({ ...valid, startDate: "2026-02-30" }).startDate, "Enter a date as dd/mm/yyyy.");
assert.equal(warrantyErrors({ ...valid, coverageNote: "x".repeat(501) }).coverageNote, "Enter 500 characters or fewer.");
// Q25: an older record with no dates can't go on
assert.equal(warrantyErrors(draftFromRecord({ provider: "A", type: "B", startDate: null, endDate: null, referenceNo: null, coverageNote: null })).startDate,
  "Choose the start date.");

// Payloads
assert.deepEqual(addWarrantyBody({ ...valid, referenceNo: "  " }, [], null), {
  provider: "Acme", warrantyType: "Extended", startDate: "2026-01-01", endDate: "2027-01-01",
  referenceNo: null, coverageNote: null, makeCurrent: true, expectedCurrentId: null,
});
assert.deepEqual(updateWarrantyBody({ ...valid, coverageNote: " note " }, ["f1"], "2026-11-13T00:00:00Z"), {
  provider: "Acme", warrantyType: "Extended", startDate: "2026-01-01", endDate: "2027-01-01",
  referenceNo: null, coverageNote: "note", fileIds: ["f1"], expectedUpdatedAt: "2026-11-13T00:00:00Z",
});
assert.equal(warrantyNeedsReload("STALE"), true);
assert.equal(warrantyNeedsReload("VALIDATION"), false);
assert.equal(warrantyNeedsReload("VALIDATION", true), true);

// Service: paths, envelopes, error mapping
const record = { id: "w1", provider: "Acme", type: "Extended", startDate: "2026-01-01", endDate: "2027-01-01", referenceNo: null,
  coverageNote: null, isCurrent: true, createdAt: "t", updatedAt: "t" };
const calls: unknown[] = [];
const reply = (status: number, data: unknown): WarrantyRequester => async (method, path, body) => {
  calls.push({ method, path, body });
  return { status, data };
};
const signal = new AbortController().signal;
assert.deepEqual(await addWarranty("c", "a 1", { x: 1 }, signal, reply(200, { success: true, data: { warranty: record } })),
  { ok: true, data: { warranty: record } });
assert.deepEqual(calls.at(-1), { method: "POST", path: "/a%201/warranties", body: { x: 1 } });
await updateWarranty("c", "a1", "w1", {}, signal, reply(200, { success: true, data: { warranty: record } }));
assert.deepEqual(calls.at(-1), { method: "PATCH", path: "/a1/warranties/w1", body: {} });
await setCurrentWarranty("c", "a1", "w2", "w1", signal, reply(200, { success: true, data: { warranty: record } }));
assert.deepEqual(calls.at(-1), { method: "POST", path: "/a1/warranties/w2/set-current", body: { expectedCurrentId: "w1" } });
assert.deepEqual(await addWarranty("c", "a1", {}, signal, reply(409, { error: { code: "STALE" } })), { ok: false, code: "STALE", uncertain: false, details: undefined });
assert.equal((await addWarranty("c", "a1", {}, signal, reply(500, { error: { code: "INTERNAL" } }))).ok === false, true);
const internal = await addWarranty("c", "a1", {}, signal, reply(500, { error: { code: "INTERNAL" } }));
assert.equal(!internal.ok && internal.uncertain, true);
const broken = await addWarranty("c", "a1", {}, signal, async () => { throw new Error("down"); });
assert.equal(!broken.ok && broken.code === "CONNECTION_FAILED" && broken.uncertain, true);

console.log("warranty-form checks passed");
