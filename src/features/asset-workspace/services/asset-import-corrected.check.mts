import assert from "node:assert/strict";
import { read, utils, write } from "xlsx";
import { buildCorrectedImport } from "./asset-import-corrected.ts";
import { readImportCsv } from "./asset-import-parse.ts";
import type { ImportRow } from "../domain/asset-import-types.ts";

function row(rowIndex: number, values: ImportRow["values"]): ImportRow {
  return { id: `row-${rowIndex}`, rowIndex, values, version: 2, editedAt: "2026-11-19T00:00:00Z", severity: "valid",
    messages: [], result: null, createdAsset: null, override: null, originalRowIndex: null };
}
const original = utils.aoa_to_sheet([
  [], ["Equipment", "Group", "Unmapped", "Date", "Formula", "Notes"],
  ["  Desk  ", "OLD", "0007", 45292, 6, "clear"], [], ["Keep", "OTHER", "untouched"],
]);
original.D3.z = "yyyy-mm-dd";
original.E3 = { t: "n", v: 6, f: "3*2" };
original["!merges"] = [{ s: { r: 6, c: 0 }, e: { r: 6, c: 1 } }];
original["!ref"] = "A1:H9";
const workbook = utils.book_new();
utils.book_append_sheet(workbook, original, "Assets");
utils.book_append_sheet(workbook, utils.aoa_to_sheet([["Second", "00123"]]), "Reference");
const bytes = write(workbook, { type: "array", bookType: "xlsx" });
const values = { name: "Desk", category: "NEW", purchase_date: "2024-01-01", notes: "" };
const corrected = await buildCorrectedImport(bytes, "assets.xlsx", ["name", "category", null, "purchase_date", null, "notes"], [row(3, values)]);
assert.equal(corrected.filename, "assets-corrected.xlsx");
const output = read(await corrected.blob.arrayBuffer(), { type: "array", cellNF: true, cellFormula: true });
const before = read(bytes, { type: "array", cellNF: true, cellFormula: true });
assert.deepEqual(output.SheetNames, ["Assets", "Reference"]);
for (const address of ["A3", "C3", "D3", "E3", "A5", "B5", "C5", "!merges", "!ref"]) {
  assert.deepEqual(output.Sheets.Assets[address], before.Sheets.Assets[address], `untouched ${address}`);
}
assert.deepEqual(output.Sheets.Reference, before.Sheets.Reference);
assert.equal(output.Sheets.Assets.B3.v, "NEW");
assert.equal(output.Sheets.Assets.F3.v, "");
assert.equal(output.Sheets.Assets.E3.f, "3*2");

for (const delimiter of [",", ";"]) {
  const source = `\uFEFFEquipment${delimiter}Group${delimiter}Unmapped${delimiter}Notes\r\n"  Desk  "${delimiter}OLD${delimiter}0007${delimiter}"keep\r\nline"\r\n\r\nKeep${delimiter}OTHER${delimiter}" x "${delimiter}tail\r\n`;
  const buffer = new TextEncoder().encode(source).buffer;
  const result = await buildCorrectedImport(buffer, "assets.csv", ["name", "category", null, "notes"], [row(2, {
    name: "Desk", category: 'N"EW', notes: "keep\r\nline",
  })]);
  const text = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await result.blob.arrayBuffer());
  assert.equal(text, source.replace(`${delimiter}OLD${delimiter}`, `${delimiter}"N""EW"${delimiter}`));
  const parsed = readImportCsv(await result.blob.arrayBuffer(), 5000);
  assert.equal(parsed.rows[0].cells[1], 'N"EW');
  assert.equal(parsed.rows[1].rowIndex, 4);
}
// An edit that looks like a formula is written with a leading ' and reads back unchanged.
const formula = '=HYPERLINK("http://example.test")';
const plainCsv = new TextEncoder().encode("Equipment,Group\r\nDesk,OLD\r\n").buffer;
const safe = await buildCorrectedImport(plainCsv, "assets.csv", ["name", "category"], [row(2, { name: "Desk", category: formula })]);
assert.equal(await safe.blob.text(), `Equipment,Group\r\nDesk,"'=HYPERLINK(""http://example.test"")"\r\n`);
assert.equal(readImportCsv(await safe.blob.arrayBuffer(), 5000).rows[0].cells[1], formula);
// Only the ' before a formula character is removed.
assert.equal(readImportCsv(new TextEncoder().encode("A\r\n'Plain\r\n").buffer, 5000).rows[0].cells[0], "'Plain");
await assert.rejects(() => buildCorrectedImport(bytes, "assets.xlsx", [], [row(3, values)]), /mapping/);
console.log("Corrected import CSV/XLSX checks passed");
