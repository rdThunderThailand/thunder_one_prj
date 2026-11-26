/** Run: node src/features/asset-workspace/services/asset-import-restore.check.mts */
import assert from "node:assert/strict";
import type { ImportBatch, ImportOptions } from "../domain/asset-import-types.ts";
import type { AssetImportApi } from "./asset-import-api.ts";
import { restoreImportFile } from "./asset-import-restore.ts";

// The fake Storage responses are confined to this check file.
const csv = "Asset Name,Category,Location\r\nDisplay,DISPLAY,HQ";
const size = new Blob([csv]).size;
const batch = {
  id: "11111111-1111-4111-8111-111111111111",
  sourceFile: { id: "22222222-2222-4222-8222-222222222222", name: "assets.csv", sizeBytes: size, mimeType: "text/csv" },
} as unknown as ImportBatch;
const options = { file: { extensions: [".csv", ".xlsx"], maxBytes: 1024 * 1024, maxRows: 100 } } as unknown as ImportOptions;
const api = {
  sourceFileUrl: async () => ({ url: "https://storage.example.invalid/signed", name: "assets.csv" }),
} as unknown as AssetImportApi;
const signal = new AbortController().signal;

let request: RequestInit | undefined;
globalThis.fetch = (async (_url: string, init: RequestInit) => {
  request = init;
  return new Response(csv);
}) as typeof fetch;
const restored = await restoreImportFile(api, batch, options, signal);
assert.equal(restored.name, "assets.csv");
assert.deepEqual(restored.headers, ["Asset Name", "Category", "Location"]);
assert.equal(restored.rows.length, 1);
assert.equal(request?.signal, signal, "leaving the page cancels the download");
assert.equal(request?.credentials, "omit", "the signed link needs no cookies");

await assert.rejects(
  restoreImportFile(api, { ...batch, sourceFile: { ...batch.sourceFile!, sizeBytes: size + 1 } }, options, signal),
  /does not match/,
  "a different file is never used for this batch",
);

globalThis.fetch = (async () => new Response("missing", { status: 404 })) as typeof fetch;
await assert.rejects(restoreImportFile(api, batch, options, signal), /could not be downloaded/);

const failing = { sourceFileUrl: async () => { throw new Error("no link"); } } as unknown as AssetImportApi;
await assert.rejects(restoreImportFile(failing, batch, options, signal), /no link/);

console.log("asset-import-restore.check.mts: restored parse, cancellation, size match and failures passed");
