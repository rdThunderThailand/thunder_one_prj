import assert from "node:assert/strict";
import { loadRegistrationCategory, type RegistrationCategoryRequester } from "./registration-category-prefill.ts";

const id = "c1111111-1111-1111-1111-111111111111";
const category = { id, name: "CCTV", is_serial_required: true };
const signal = new AbortController().signal;
let calls = 0;
const requester: RegistrationCategoryRequester = async (context, input, receivedSignal) => {
  calls++;
  assert.equal(context, "tenant:user");
  assert.equal(input, id);
  assert.equal(receivedSignal, signal);
  return { items: [category], pageSize: 1, hasMore: false };
};
const valid = await loadRegistrationCategory("tenant:user", id.toUpperCase(), signal, requester);
assert.ok(valid.ok && valid.category.id === id && valid.category.is_serial_required);
assert.equal(calls, 1);
for (const invalid of ["", "bad", [id, id]]) {
  const result = await loadRegistrationCategory("tenant:user", invalid, signal, async () => assert.fail("invalid URL must not dispatch"));
  assert.ok(!result.ok && result.status === 400);
}
const missing = await loadRegistrationCategory("tenant:user", id, signal, async () => ({ items: [], pageSize: 1, hasMore: false }));
assert.ok(!missing.ok && missing.status === 404);
const wrong = await loadRegistrationCategory("tenant:user", id, signal, async () => ({
  items: [{ ...category, id: "c2222222-2222-2222-2222-222222222222" }], pageSize: 1, hasMore: false,
}));
assert.ok(!wrong.ok && wrong.status === 404);
const malformed = await loadRegistrationCategory("tenant:user", id, signal, async () => ({ items: [{ id, name: "CCTV" }], pageSize: 1, hasMore: false }));
assert.ok(!malformed.ok && malformed.status === 502, "unknown serial rules cannot be guessed");
for (const status of [401, 403, 404, 503]) {
  const rejected = await loadRegistrationCategory("tenant:user", id, signal, async () => { throw Object.assign(new Error("private server diagnostics"), { status }); });
  assert.ok(!rejected.ok && rejected.status === status && !rejected.message.includes("private server diagnostics"));
}
const cancelled = new AbortController();
cancelled.abort();
await assert.rejects(() => loadRegistrationCategory("tenant:user", id, cancelled.signal, async () => assert.fail("aborted read must not dispatch")));
const pending = new AbortController();
await assert.rejects(() => loadRegistrationCategory("tenant:user", id, pending.signal, async () => {
  pending.abort();
  return { items: [category], pageSize: 1, hasMore: false };
}));
console.log("Registration category context, active-reference resolution, invalid/missing metadata, safe failures and cancellation checks passed; no live requests.");
