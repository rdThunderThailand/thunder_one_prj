import assert from "node:assert/strict";
import { ASSET_FILE_LIMIT, assetFilesChangeInputSchema, assetFilesFeedback, assetFilesPlan, existingFileSelections, validateAssetFile } from "./asset-files-edit.ts";
import { changeAssetFiles } from "../services/asset-files-change.ts";

const id = (index: number) => `10000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const stored = (index: number) => ({ fileId: id(index), filename: `${index}.jpg`, mimeType: "image/jpeg", sizeBytes: 100,
  uploadedAt: "2026-11-09T00:00:00Z", url: null, thumbnailUrl: null, uploadedBy: null });
const original = [stored(1), stored(2), stored(3), stored(4)];
const pending = { id: id(20), existing: null, file: new File(["bytes"], "new.jpg", { type: "image/jpeg" }), previewUrl: null };
const selections = existingFileSelections(original);
assert.equal(ASSET_FILE_LIMIT.photo, 4);
assert.equal(ASSET_FILE_LIMIT.document, 10);
assert.equal(assetFilesPlan(original, selections, "photo", "").dirty, false);
const replace = [...selections.slice(1), pending];
assert.equal(assetFilesPlan(original, replace, "photo", "").valid, false);
assert.match(assetFilesPlan(original, replace, "photo", "").reasonError, /reason/);
const plan = assetFilesPlan(original, replace, "photo", " Damaged ");
assert.equal(plan.valid, true);
assert.deepEqual(plan.remove, [id(1)]);
assert.equal(plan.reason, "Damaged");
assert.equal(assetFilesPlan(original, [...selections, pending], "photo", "").valid, false);
assert.equal(assetFilesPlan(original, [], "photo", "Removed all").valid, true);
assert.equal(assetFilesPlan(original, replace, "photo", "x".repeat(1001)).valid, false);
const documents = Array.from({ length: 10 }, (_, index) => stored(index + 30));
assert.equal(assetFilesPlan(documents, [...existingFileSelections(documents), pending], "document", "").valid, false);
assert.equal(assetFilesPlan([], [pending], "document", "Unused old reason").reason, undefined);
assert.equal(validateAssetFile(pending.file, "photo", 10485760), null);
assert.ok(validateAssetFile({ name: "document.pdf", type: "application/pdf", size: 100 }, "photo", 10485760));
assert.equal(validateAssetFile({ name: "document.pdf", type: "application/pdf", size: 100 }, "document", 10485760), null);
assert.ok(validateAssetFile({ name: "wrong.png", type: "image/jpeg", size: 100 }, "photo", 10485760));
assert.ok(validateAssetFile({ name: "big.jpg", type: "image/jpeg", size: 10485761 }, "photo", 10485760));
const timestamp = "2026-11-09T10:20:30.123456+00:00";
const input = { expectedUpdatedAt: timestamp, add: [id(20)], remove: [id(1)], reason: "Damaged" };
assert.equal(assetFilesChangeInputSchema.parse(input).expectedUpdatedAt, timestamp);
assert.equal(assetFilesChangeInputSchema.safeParse({ ...input, reason: " " }).success, false);
assert.equal(assetFilesChangeInputSchema.safeParse({ ...input, add: [id(1)] }).success, false);
assert.equal(assetFilesChangeInputSchema.safeParse({ ...input, add: [], remove: [] }).success, false);
let calls = 0;
const invalid = await changeAssetFiles("context", id(99), { ...input, reason: "" }, new AbortController().signal, async () => {
  calls++; return { status: 200, data: {} };
});
assert.equal(invalid.ok, false);
assert.equal(calls, 0);
const stale = await changeAssetFiles("context", id(99), input, new AbortController().signal, async (_id, body) => {
  calls++; assert.equal(body.expectedUpdatedAt, timestamp);
  return { status: 409, data: { error: { code: "STALE" } } };
});
assert.equal(stale.ok, false);
if (!stale.ok) { assert.equal(stale.code, "STALE"); assert.equal(stale.uncertain, false); }
assert.equal(calls, 1);
const uncertain = await changeAssetFiles("context", id(99), input, new AbortController().signal, async () => { throw new Error("lost response"); });
if (uncertain.ok) assert.fail("a lost write response must stay uncertain");
assert.equal(uncertain.uncertain, true);
const saved = await changeAssetFiles("context", id(99), input, new AbortController().signal, async () => ({ status: 200,
  data: { success: true, data: { photos: original.slice(1), documents: [], warrantyDocuments: [], expiresAt: "2026-11-09T12:00:00Z", updatedAt: timestamp } } }));
assert.equal(saved.ok, true);
if (saved.ok) assert.equal(saved.data.updatedAt, timestamp);
assert.match(assetFilesFeedback("PERMISSION_DENIED").message, /permission/);
console.log("asset-files-edit checks passed");
