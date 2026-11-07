/** Run: node src/features/asset-workspace/services/asset-category-create.check.mts */
import assert from "node:assert/strict";
import { createAssetCategory, type CategoryCreateRequester } from "./asset-category-create.ts";
import { emptyCategoryDraft, validateCategoryDraft } from "../domain/category-form.ts";

const id = "c1111111-1111-1111-1111-111111111111";
const draft = validateCategoryDraft({ ...emptyCategoryDraft, name: " Computer ", code: " lap-01 ", isSerialRequired: true });
if (!draft.ok) throw new Error("Invalid fixture");
const input = draft.input;
const context = "tenant:user";
const signal = new AbortController().signal;
const detail = {
  id, name: "Computer", code: "LAP-01", parentId: null, parent: null, description: null,
  isSerialRequired: true, status: "Active", ownAssetCount: 0, assetCount: 0, childCount: 0,
  updatedAt: "2026-11-07T00:00:00.123456+00:00", children: [],
};
const response = (status: number, data: unknown): CategoryCreateRequester => async () => ({ status, data });
let calls = 0;
const success = await createAssetCategory(context, input, signal, async (body, options) => {
  calls++;
  assert.deepEqual(body, { name: "Computer", code: "lap-01", parentId: null, description: null, isSerialRequired: true });
  assert.deepEqual(options, { context, signal });
  return { status: 200, data: { success: true, data: detail } };
});
assert.deepEqual(success, { ok: true, data: detail });
assert.equal(calls, 1);

for (const [status, code, field] of [
  [409, "DUPLICATE_NAME", "name"], [409, "DUPLICATE_CODE", "code"], [400, "INVALID_PARENT", "parentId"],
] as const) {
  const failed = await createAssetCategory(context, input, signal,
    response(status, { error: { code, message: "private upstream diagnostics" } }));
  assert.ok(!failed.ok && !failed.uncertain && failed.fields[field]);
  assert.ok(!JSON.stringify(failed).includes("private upstream diagnostics"));
}
const fieldError = await createAssetCategory(context, input, signal,
  response(400, { error: { code: "VALIDATION", details: { parentId: ["Invalid UUID"] } } }));
assert.ok(!fieldError.ok && fieldError.fields.parentId && !fieldError.uncertain);
for (const status of [401, 403]) {
  const denied = await createAssetCategory(context, input, signal, response(status, { error: "Rejected", uncertain: false }));
  assert.ok(!denied.ok && denied.status === status && !denied.uncertain);
}
const preflight = await createAssetCategory(context, input, signal,
  response(503, { error: "Not configured", uncertain: false }));
assert.ok(!preflight.ok && !preflight.uncertain, "explicit proxy pre-dispatch rejection is safe to correct");

for (const [status, data] of [
  [502, { code: "UPSTREAM_FAILED", error: "Unavailable", uncertain: true }],
  [500, { error: { code: "INTERNAL", message: "Internal" } }],
  [200, { success: true, data: { id } }],
  [200, { success: true, data: { ...detail, status: "Invalid" } }],
] as const) {
  let attempts = 0;
  const unknown = await createAssetCategory(context, input, signal, async () => {
    attempts++;
    return { status, data };
  });
  assert.ok(!unknown.ok && unknown.uncertain);
  assert.equal(attempts, 1, "uncertain creates are never retried automatically");
}
const network = await createAssetCategory(context, input, signal, async () => { throw new Error("private timeout details"); });
assert.ok(!network.ok && network.uncertain && !network.message.includes("private timeout details"));
const cancelled = new AbortController();
cancelled.abort();
const notDispatched = await createAssetCategory(context, input, cancelled.signal, async () => {
  assert.fail("already-cancelled writes must not dispatch");
});
assert.ok(!notDispatched.ok && !notDispatched.uncertain);
const interrupted = new AbortController();
const uncertainCancel = await createAssetCategory(context, input, interrupted.signal, async () => {
  interrupted.abort();
  throw new Error("Aborted after dispatch");
});
assert.ok(!uncertainCancel.ok && uncertainCancel.uncertain);
console.log("Category create context, success, field errors, rejection, and uncertain-write checks passed.");
