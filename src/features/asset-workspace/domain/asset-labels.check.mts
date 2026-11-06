/** Run: node src/features/asset-workspace/domain/asset-labels.check.mts */
import assert from "node:assert/strict";
import { AssetActionError } from "./asset-action-error.ts";
import { assertLabelFormat, assertLabelTags, assetLabelsFilename, labelFailure, labelScope, type LabelCandidate } from "./asset-labels.ts";
import { LABEL_LAYOUT, LABEL_PAGE, labelNameLines, mmToPoints } from "./asset-label-layout.ts";

const id = (index: number) => `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`;
const asset: LabelCandidate = { id: id(1), name: "จอภาพ", assetTag: "AST-000001", status: "Available" };
const scope = labelScope([asset, { ...asset, id: asset.id.toUpperCase() }]);
assert.equal(scope.length, 1);
asset.name = "Changed locally";
assert.equal(scope[0].name, "จอภาพ", "the action owns a snapshot of the selection");
assert.throws(() => labelScope([]), /Select assets first/);
assert.throws(() => labelScope([{ ...asset, id: "not-a-uuid" }]));
assert.equal(labelScope(Array.from({ length: 500 }, (_, index) => ({ ...asset, id: id(index) }))).length, 500);
assert.throws(() => labelScope(Array.from({ length: 501 }, (_, index) => ({ ...asset, id: id(index) }))), /500/);
assert.equal(labelScope(Array(1000).fill(asset)).length, 1, "deduplicate before applying the limit");
for (const ineligible of [{ status: "Disposed" }, { assetTag: "  " }]) {
  assert.throws(() => labelScope([asset, { ...asset, id: id(2), ...ineligible }]), (error) =>
    error instanceof AssetActionError && error.status === 409 && error.assetNames.length === 1);
}
const label = { ...asset, qrValue: `https://app.example/${id(9)}/assets/${asset.id}` };
assert.doesNotThrow(() => assertLabelTags([label]));
for (const assetTag of ["แท็ก-001", "TAG\n001", "TAG😀"]) {
  assert.throws(() => assertLabelTags([{ ...label, assetTag }]), (error) =>
    error instanceof AssetActionError && error.code === "INVALID_TAG");
}
for (const format of ["qr", "barcode"] as const) assert.doesNotThrow(() => assertLabelFormat([label], format));
assert.doesNotThrow(() => assertLabelFormat([{ ...label, assetTag: "แท็ก-001" }], "qr"));
assert.throws(() => assertLabelFormat([{ ...label, assetTag: "แท็ก-001" }], "barcode"), /Code128/);
assert.throws(() => assertLabelFormat([label], "both" as never), /Choose QR Code or Barcode/);
const conflict = labelFailure({ status: 409, code: "INVALID_STATE", details: { assetIds: [id(1), id(99)] } }, [asset]);
assert.deepEqual(conflict.assetNames, [asset.name], "never reveal a name outside the requested scope");
for (const status of [400, 401, 403, 404, 500]) {
  const failure = labelFailure({ status, code: "FAILURE", details: { assetIds: [asset.id] } }, [asset]);
  assert.equal(failure.status, status);
  assert.deepEqual(failure.assetNames, []);
}
assert.equal(labelFailure({ status: 400, code: "VALIDATION", serverMessage: "Select at most 500 assets" }, []).message, "Select at most 500 assets");
assert.equal(labelFailure({ status: 500, code: "INTERNAL", serverMessage: "Private diagnostic" }, []).message.includes("Private diagnostic"), false);
assert.equal(assetLabelsFilename(new Date("2026-11-05T17:00:00Z")), "asset-labels-2026-11-06.pdf");
assert.equal(LABEL_PAGE.width, mmToPoints(50));
assert.equal(LABEL_PAGE.height, mmToPoints(30));
for (const box of Object.values(LABEL_LAYOUT).flatMap((layout) => Object.values(layout))) {
  assert.ok(box.x >= 0 && box.y >= 0 && box.x + box.width <= 50 && box.y + box.height <= 30);
}
const graphemes = (text: string) => [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(text)].length;
const lines = labelNameLines("กำลังทดสอบจอภาพที่มีชื่อยาวมาก", graphemes, 6);
assert.equal(lines.length, 2);
assert.ok(lines.every((line) => graphemes(line) <= 6));
assert.ok(lines[1].endsWith("…"));
assert.equal(labelNameLines("", graphemes, 100)[0], "Unnamed asset");
console.log("Labels: scope, 500-ID cap, atomic eligibility, errors, Thai wrapping and print dimensions passed.");
