/** Run: node src/features/asset-workspace/services/asset-export-client.check.mts */
import assert from "node:assert/strict";
import { EXPORT_COLUMNS, type AssetExportRequest } from "../domain/asset-export.ts";
import { AssetExportError, requestAssetExport } from "./asset-export-client.ts";

const context = "11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222";
const body: AssetExportRequest = { scope: "filtered", filters: { status: "Available" } };
// Core's toCsv quotes every cell, including the fixed header (utils/csv.ts).
const csv = EXPORT_COLUMNS.map((column) => `"${column}"`).join(",") + '\r\n"11111111-1111-4111-8111-111111111111","AST-000001","จอ, ชั้น 1","SN001","Office","HQ","Available","Good","","2026-05-12","2026-11-05T00:00:00Z"\r\n';

for (const source of [csv, "\uFEFF" + csv, new Blob(["\uFEFF", csv])]) {
  const controller = new AbortController();
  const file = await requestAssetExport(context, body, controller.signal, async (input) => {
    assert.equal(input.url, "/api/proxy/v2/asset-workspace/assets/export");
    assert.equal(input.method, "POST");
    assert.equal(input.responseType, "blob");
    assert.deepEqual(input.headers, { "x-registration-context": context });
    assert.equal(input.data, body);
    assert.equal(input.signal, controller.signal);
    return { status: 200, data: source };
  });
  assert.equal(await file.blob.text(), csv, "Core CSV cells and Thai text remain unchanged");
  const bytes = new Uint8Array(await file.blob.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.notEqual(bytes[3], 0xef, "exactly one BOM");
  assert.match(file.filename, /^assets-export-\d{4}-\d{2}-\d{2}\.csv$/);
}

for (const [status, code, expected] of [
  [400, "VALIDATION", "Narrow the filters"],
  [401, "UNAUTHENTICATED", "Sign in again"],
  [403, "PERMISSION_DENIED", "permission"],
  [404, "NOT_FOUND", "No eligible assets"],
  [503, "INTERNAL", "unavailable"],
] as const) {
  await assert.rejects(
    () => requestAssetExport(context, body, new AbortController().signal, async () => ({
      status, data: new Blob([JSON.stringify({ error: { code, message: "Narrow the filters" } })]),
    })),
    (error) => error instanceof AssetExportError && error.status === status && error.message.includes(expected),
  );
}
for (const source of [{ success: true }, '{"error":"Denied"}', "<html>Not found</html>", "Wrong,Header\nA,B"]) {
  await assert.rejects(() => requestAssetExport(context, body, new AbortController().signal,
    async () => ({ status: 200, data: source })),
  (error) => error instanceof AssetExportError && error.code === "INVALID_RESPONSE");
}
await assert.rejects(() => requestAssetExport(context, body, new AbortController().signal,
  async () => ({ status: 404, data: "<html>Missing route</html>" })),
(error) => error instanceof AssetExportError && error.message.includes("not available"));
await assert.rejects(() => requestAssetExport(context, body, new AbortController().signal,
  async () => { throw new Error("Offline"); }),
(error) => error instanceof AssetExportError && error.code === "CONNECTION_FAILED");
const cancelled = new AbortController();
await assert.rejects(() => requestAssetExport(context, body, cancelled.signal, async () => {
  cancelled.abort();
  return { status: 200, data: csv };
}), (error) => error instanceof DOMException && error.name === "AbortError");
console.log("Asset export POST/blob handling, exact CSV/BOM, error files, unavailable route and cancellation checks passed.");
