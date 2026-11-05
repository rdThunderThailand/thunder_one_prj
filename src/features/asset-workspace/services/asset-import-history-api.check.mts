/** Run: node src/features/asset-workspace/services/asset-import-history-api.check.mts */
import assert from "node:assert/strict";
import { AssetActionError } from "../domain/asset-action-error.ts";
import type { AssetActionRequester } from "./asset-action-api.ts";
import { getImportHistory } from "./asset-import-history-api.ts";

const id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const context = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa:cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const controller = new AbortController();
const invalid = (body: unknown): AssetActionRequester => async () => body;
const batch = { id, batchCode: "IMP-20261105-0001", fileName: null, createdAt: "2026-11-05T00:00:00Z",
  status: "partially_completed", counts: { total: 10, created: 8, failed: 2 } };
const history = await getImportHistory(context, 2, controller.signal, async (method, path, body, options) => {
  assert.equal(method, "GET");
  assert.equal(path, "/imports?page=2&pageSize=25");
  assert.equal(body, undefined);
  assert.equal(options.context, context);
  return { batches: [batch], page: 2, pageSize: 25, total: 26 };
});
assert.equal(history.batches[0].fileName, null);
await assert.rejects(() => getImportHistory(context, 2, controller.signal,
  invalid({ batches: [batch], page: 1, pageSize: 25, total: 26 })), AssetActionError);
await assert.rejects(() => getImportHistory(context, 1, controller.signal,
  invalid({ batches: [{ ...batch, status: "processing" }], page: 1, pageSize: 25, total: 1 })), AssetActionError);
console.log("Import History: request context, paging, nullable filename and finished-only response contract passed without network calls.");
