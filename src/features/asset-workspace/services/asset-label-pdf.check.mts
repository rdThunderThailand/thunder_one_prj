/** Run: node src/features/asset-workspace/services/asset-label-pdf.check.mts */
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { LABEL_PAGE } from "../domain/asset-label-layout.ts";
import { assetLabelRectangles } from "./asset-label-codes.ts";
import { createAssetLabelsPdf } from "./asset-label-pdf.ts";

const label = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", assetTag: "AST-000001", name: "จอภาพ",
  qrValue: "https://app.example/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/assets/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" };
// A tiny PNG replaces browser font rasterization in this Node-only check; Thai visual QA remains required.
const png = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6E8AAAAASUVORK5CYII=", "base64"));
const rectangles = await assetLabelRectangles(label);
assert.ok(rectangles.length > 100, "actual QR modules and Code128 bars are vector rectangles");
for (const rectangle of rectangles) {
  assert.ok(rectangle.x >= 0 && rectangle.y >= 0 && rectangle.width > 0 && rectangle.height > 0);
  assert.ok(rectangle.x + rectangle.width <= LABEL_PAGE.width && rectangle.y + rectangle.height <= LABEL_PAGE.height);
}
const progress: number[] = [];
const secondId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const file = await createAssetLabelsPdf([label, { ...label, id: secondId, assetTag: "AST-000002", qrValue: label.qrValue.replace(label.id, secondId) }],
  new AbortController().signal, (completed) => progress.push(completed), async () => png);
assert.equal(file.blob.type, "application/pdf");
assert.match(file.filename, /^asset-labels-\d{4}-\d{2}-\d{2}\.pdf$/);
assert.deepEqual(progress, [0, 1, 2, 3], "each prepared page advances progress; only the serialized PDF completes the final step");
const document = await PDFDocument.load(await file.blob.arrayBuffer());
assert.equal(document.getPageCount(), 2);
for (const page of document.getPages()) assert.deepEqual(page.getSize(), LABEL_PAGE);
const cancelled = new AbortController();
const completed: number[] = [];
await assert.rejects(() => createAssetLabelsPdf([label, label], cancelled.signal, (count) => {
  completed.push(count);
  if (count === 1) cancelled.abort();
}, async () => png), (error) => error instanceof DOMException && error.name === "AbortError");
assert.deepEqual(completed, [0, 1], "cancellation yields no file or subsequent pages");
const finalizing = new AbortController();
await assert.rejects(() => createAssetLabelsPdf([label], finalizing.signal, (count) => {
  if (count === 2) finalizing.abort();
}, async () => png), (error) => error instanceof DOMException && error.name === "AbortError");
let rendered = false;
await assert.rejects(() => createAssetLabelsPdf([label, { ...label, assetTag: "แท็ก" }], new AbortController().signal, () => {}, async () => {
  rendered = true; return png;
}));
assert.equal(rendered, false, "invalid tags block the entire PDF before generation");
console.log("Labels PDF: real vector encoders, 50×30 mm pages, complete artifact, per-page progress and cancellation passed. Browser font/physical scan tests are separate.");
