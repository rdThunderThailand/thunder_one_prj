/** Run: node src/features/asset-workspace/services/asset-label-pdf.check.mts */
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { labelLayout, LABEL_PAGE, mmToPoints } from "../domain/asset-label-layout.ts";
import { DEFAULT_LABEL_FIELDS, LABEL_FORMATS } from "../domain/asset-labels.ts";
import { assetLabelRectangles } from "./asset-label-codes.ts";
import { createAssetLabelsPdf } from "./asset-label-pdf.ts";

type Box = { x: number; y: number; width: number; height: number };
const label = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", assetTag: "AST-000001", name: "จอภาพ",
  qrValue: "https://app.example/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/assets/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" };
// A tiny PNG replaces browser font rasterization in this Node-only check; Thai visual QA remains required.
const png = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6E8AAAAASUVORK5CYII=", "base64"));
const inside = (rectangle: { x: number; y: number; width: number; height: number }, box: { x: number; y: number; width: number; height: number }) =>
  rectangle.x >= mmToPoints(box.x) && rectangle.y >= mmToPoints(box.y)
  && rectangle.x + rectangle.width <= mmToPoints(box.x + box.width) + 1e-8 && rectangle.y + rectangle.height <= mmToPoints(box.y + box.height) + 1e-8;
for (const format of LABEL_FORMATS) {
  const rectangles = await assetLabelRectangles(label, format);
  const layout: { qr?: Box; barcode?: Box; text: Box } = labelLayout(format);
  assert.ok(rectangles.length > 20, "real vector encoder produces the selected code");
  const bars = rectangles.filter((rectangle) => layout.barcode && inside(rectangle, layout.barcode));
  const modules = rectangles.filter((rectangle) => layout.qr && inside(rectangle, layout.qr));
  assert.equal(bars.length + modules.length, rectangles.length, "every mark sits inside its code box");
  assert.equal(bars.length > 0, format !== "qr", "Code128 bars only when the label type has a barcode");
  assert.equal(modules.length > 0, format !== "barcode", "QR modules only when the label type has a QR code");
  for (const rectangle of rectangles) assert.ok(rectangle.width > 0 && rectangle.height > 0);
  for (const bar of bars) assert.equal(bar.height, mmToPoints(layout.barcode!.height));
  const renderFormats: string[] = [];
  const output = await createAssetLabelsPdf([label], format, DEFAULT_LABEL_FIELDS, new AbortController().signal, () => {}, async (_label, selected) => {
    renderFormats.push(selected);
    return png;
  });
  assert.deepEqual(renderFormats, [format], "text and codes use the same selected format");
  const pdf = await PDFDocument.load(await output.blob.arrayBuffer());
  assert.equal(pdf.getPageCount(), 1);
  assert.deepEqual(pdf.getPage(0).getSize(), LABEL_PAGE);
}
const progress: number[] = [];
const secondId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const file = await createAssetLabelsPdf([label, { ...label, id: secondId, assetTag: "AST-000002", qrValue: label.qrValue.replace(label.id, secondId) }],
  "qr", DEFAULT_LABEL_FIELDS, new AbortController().signal, (completed) => progress.push(completed), async () => png);
assert.equal(file.blob.type, "application/pdf");
assert.match(file.filename, /^asset-labels-\d{4}-\d{2}-\d{2}\.pdf$/);
assert.deepEqual(progress, [0, 1, 2, 3], "each prepared page advances progress; only the serialized PDF completes the final step");
const document = await PDFDocument.load(await file.blob.arrayBuffer());
assert.equal(document.getPageCount(), 2);
for (const page of document.getPages()) assert.deepEqual(page.getSize(), LABEL_PAGE);
const cancelled = new AbortController();
const completed: number[] = [];
await assert.rejects(() => createAssetLabelsPdf([label, label], "qr", DEFAULT_LABEL_FIELDS, cancelled.signal, (count) => {
  completed.push(count);
  if (count === 1) cancelled.abort();
}, async () => png), (error) => error instanceof DOMException && error.name === "AbortError");
assert.deepEqual(completed, [0, 1], "cancellation yields no file or subsequent pages");
const finalizing = new AbortController();
await assert.rejects(() => createAssetLabelsPdf([label], "qr", DEFAULT_LABEL_FIELDS, finalizing.signal, (count) => {
  if (count === 2) finalizing.abort();
}, async () => png), (error) => error instanceof DOMException && error.name === "AbortError");
let rendered = false;
await assert.rejects(() => createAssetLabelsPdf([label, { ...label, assetTag: "แท็ก" }], "barcode", DEFAULT_LABEL_FIELDS, new AbortController().signal, () => {}, async () => {
  rendered = true; return png;
}));
assert.equal(rendered, false, "invalid tags block the entire PDF before generation");
await createAssetLabelsPdf([{ ...label, assetTag: "แท็ก" }], "qr", DEFAULT_LABEL_FIELDS, new AbortController().signal, () => {}, async () => png);
await assert.rejects(() => assetLabelRectangles({ ...label, assetTag: "แท็ก" }, "barcode"), /Code128/);
console.log("Labels PDF: real vector encoders, 50×30 mm pages, complete artifact, per-page progress and cancellation passed. Browser font/physical scan tests are separate.");
