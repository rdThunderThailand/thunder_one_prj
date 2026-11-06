/** Run: node src/features/asset-workspace/services/asset-labels-api.check.mts */
import assert from "node:assert/strict";
import { AssetActionError } from "../domain/asset-action-error.ts";
import { getAssetLabels } from "./asset-labels-api.ts";
import type { AssetActionRequester } from "./asset-action-api.ts";

const tenant = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const other = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const context = `${tenant}:${other}`;
const asset = { id, name: "จอภาพ", assetTag: "AST-000001", status: "Available" };
const label = { id, name: asset.name, assetTag: asset.assetTag, qrValue: `https://app.example/${tenant}/assets/${id}` };
const controller = new AbortController();
const response = await getAssetLabels(context, [asset, asset], controller.signal, async (method, path, body, options) => {
  assert.equal(method, "POST");
  assert.equal(path, "/labels");
  assert.deepEqual(body, { asset_ids: [id] });
  assert.deepEqual(options, { context, signal: controller.signal });
  return { labels: [label] };
});
assert.deepEqual(response, [label]);
const invalid = (body: unknown): AssetActionRequester => async () => body;
for (const body of [
  { labels: [] }, { labels: [label, label] }, { labels: [{ ...label, id: other }] },
  { labels: [{ ...label, qrValue: `https://app.example/${other}/assets/${id}` }] },
  { labels: [{ ...label, qrValue: `https://app.example/${tenant}/assets/${other}` }] },
  { labels: [{ ...label, qrValue: id }] },
]) await assert.rejects(() => getAssetLabels(context, [asset], controller.signal, invalid(body)), AssetActionError);
const unicodeLabel = { ...label, assetTag: "แท็ก-001" };
assert.deepEqual(await getAssetLabels(context, [asset], controller.signal, invalid({ labels: [unicodeLabel] })), [unicodeLabel],
  "authorized label data remains available for QR-only output; Code128 validation belongs to format selection");
for (const status of [400, 401, 403, 404, 409, 500]) {
  await assert.rejects(() => getAssetLabels(context, [asset], controller.signal, async () => {
    throw { status, code: "ERROR", details: { assetIds: [id] } };
  }), (error) => error instanceof AssetActionError && error.status === status);
}
let calls = 0;
await assert.rejects(() => getAssetLabels(context, [{ ...asset, status: "Disposed" }], controller.signal, async () => {
  calls += 1; return { labels: [label] };
}));
assert.equal(calls, 0, "known ineligible selections never call Core");
const cancelled = new AbortController();
await assert.rejects(() => getAssetLabels(context, [asset], cancelled.signal, async () => {
  cancelled.abort(); return { labels: [label] };
}), (error) => error instanceof DOMException && error.name === "AbortError");
console.log("Labels: request context, body, exact response scope, QR references, errors and cancellation passed without network calls.");
