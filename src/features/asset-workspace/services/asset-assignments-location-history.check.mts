import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { getAssetLocationHistory, getLocationHistoryLocations } from "./asset-assignments-location-history.ts";

const id = "10000000-0000-0000-0000-000000000001";
const other = "10000000-0000-0000-0000-000000000002";
const at = "2026-11-11T09:00:00+07:00";
const before = "2026-11-10T09:00:00+07:00";
const first = { id, at: before, source: "register", from: null, to: { id: other, name: "Room", parentId: null },
  until: at, reason: null, performedBy: null };
const move = { ...first, id: other, at, source: "move", from: first.to, to: { id, name: "Bench", parentId: other },
  until: null, reason: "Bench check", performedBy: { id, name: "Jane Doe" } };
const response = { data: [move, first], page: 2, pageSize: 20, total: 22, totalPages: 2 };
const query = { page: 2, pageSize: 20 };
const controller = new AbortController();
const result = await getAssetLocationHistory("tenant:user", id, query, controller.signal, async (method, path, body, options) => {
  assert.equal(method, "GET");
  assert.equal(path, `/${id}/location-history?page=2&pageSize=20`);
  assert.equal(body, undefined);
  assert.equal(options?.context, "tenant:user");
  assert.equal(options?.signal, controller.signal);
  return response;
});
assert.ok(result.ok);
assert.deepEqual(result.data, response);
const transfer = await getAssetLocationHistory("tenant:user", id, query, controller.signal,
  async () => ({ ...response, data: [{ ...move, source: "transfer", to: null }] }));
assert.ok(transfer.ok);
assert.equal(transfer.data.data[0].to, null);

for (const data of [
  { ...response, page: 1 },
  { ...response, pageSize: 10 },
  { ...response, totalPages: 3 },
  { ...response, data: [first, first] },
  { ...response, data: [{ ...first, source: "unknown" }] },
]) {
  const invalid = await getAssetLocationHistory("tenant:user", id, query, controller.signal, async () => data);
  assert.ok(!invalid.ok);
  assert.equal(invalid.code, "CONTRACT_MISMATCH");
}
const badQuery = { ...query, date_from: "2026-11-01" };
assert.deepEqual(await getAssetLocationHistory("tenant:user", id, badQuery, controller.signal, async () => {
  assert.fail("Unsupported query reached the transport");
}), { ok: false, status: 400, code: "VALIDATION", message: "" });
for (const code of ["NOT_FOUND", "PERMISSION_DENIED", "UNAUTHENTICATED", "VALIDATION"]) {
  const error = await getAssetLocationHistory("tenant:user", id, query, controller.signal, async () => {
    throw { code, message: "Diagnostics" };
  });
  assert.ok(!error.ok);
  assert.equal(error.code, code);
  assert.equal(error.message, "");
}
const abort = new Error("Aborted");
controller.abort();
await assert.rejects(getAssetLocationHistory("tenant:user", id, query, controller.signal, async () => { throw abort; }), abort);
console.log("Location History query, event variants, pages, errors and abort checks passed");

const list = await getLocationHistoryLocations("tenant:user", new AbortController().signal, async (path, options) => {
  assert.equal(path, "/api/proxy/v2/asset-workspace/locations");
  assert.equal(options?.method, "GET");
  assert.equal(new Headers(options?.headers).get("x-registration-context"), "tenant:user");
  return Response.json({ success: true, data: [first.to, move.to] });
});
assert.ok(list.ok);
assert.equal(list.data[1].parentId, other);
const invalidList = await getLocationHistoryLocations("tenant:user", new AbortController().signal, async () =>
  Response.json({ success: true, data: [{ id, name: "Missing parent" }] }));
assert.ok(!invalidList.ok && invalidList.code === "CONTRACT_MISMATCH");
const denied = await getLocationHistoryLocations("tenant:user", new AbortController().signal, async () =>
  Response.json({ error: { code: "PERMISSION_DENIED", message: "diagnostics" } }, { status: 403 }));
assert.ok(!denied.ok && denied.code === "PERMISSION_DENIED" && denied.message === "");

type Handler = (request: Request, context: { params: Promise<{ path: string[] }> }) => Promise<Response>;
const handlers: Record<string, Handler> = {};
let cookiePresent = true;
let session: { tenantId: string; userId: string } | "forbidden" = { tenantId: "tenant", userId: "user" };
const upstream: { url: string; method: string | undefined }[] = [];
const modules: Record<string, unknown> = {
  "next/server": { NextResponse: Response },
  "next/headers": { cookies: async () => ({ get: () => cookiePresent ? { value: "test-session" } : undefined }) },
  "@/config/env": { env: { coreApiUrl: "https://core.test", coreApiKey: "test-key" } },
  "@/lib/core/tenant-selection": { selectedTenantHeader: async () => ({}) },
  "@/features/auth/services/get-session": { getSession: async () => session },
};
const route = readFileSync(new URL("../../../app/api/proxy/[...path]/route.ts", import.meta.url), "utf8");
vm.runInNewContext(ts.transpileModule(route, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText, {
  exports: handlers, URL, AbortSignal,
  require: (key: string) => modules[key],
  fetch: async (url: string, options: RequestInit) => {
    upstream.push({ url, method: options.method });
    return Response.json({ success: true, data: [] });
  },
});
const locationsPath = ["v2", "asset-workspace", "locations"];
function callProxy(method: string, path = locationsPath, headers: HeadersInit = { "x-registration-context": "tenant:user" }) {
  // Next dispatches HEAD through GET when a route supplies no explicit HEAD handler.
  return handlers[method === "HEAD" ? "GET" : method](new Request(`https://app.test/api/proxy/${path.join("/")}`, { method, headers }),
    { params: Promise.resolve({ path }) });
}
for (const method of ["POST", "PATCH", "PUT", "DELETE"]) {
  const result = await callProxy(method);
  assert.equal(result.status, 405);
  assert.equal(result.headers.get("Allow"), "GET, HEAD");
}
assert.equal((await callProxy("GET", [...locationsPath, id])).status, 404);
assert.equal((await callProxy("HEAD", [...locationsPath, id])).status, 404);
assert.equal((await callProxy("GET", locationsPath, { "x-device-token": "test-device" })).status, 403);
assert.equal((await callProxy("GET", locationsPath, { "x-registration-context": "different:user" })).status, 403);
cookiePresent = false;
assert.equal((await callProxy("GET")).status, 401);
cookiePresent = true;
session = "forbidden";
assert.equal((await callProxy("GET")).status, 403);
session = { tenantId: "tenant", userId: "user" };
assert.equal(upstream.length, 0);
for (const method of ["GET", "HEAD"]) {
  assert.equal((await callProxy(method)).status, 200);
  assert.deepEqual(upstream.at(-1), { url: "https://core.test/api/core/v2/tenants/tenant/asset-workspace/locations", method });
}
assert.equal((await callProxy("GET", ["v2", "asset-workspace", "assets", "list"], {})).status, 200);
console.log("Member locations list and exact-path GET/HEAD proxy guards passed");
