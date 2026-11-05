/** Run: node src/features/asset-workspace/services/asset-import-xlsx.check.mts */
import assert from "node:assert/strict";
import { read, utils, write, type WorkBook, type WorkSheet } from "xlsx";
import type { ImportOptions } from "../domain/asset-import-types.ts";
import { parseImportFile, ParseError } from "./asset-import-parse.ts";
import { buildTemplateXlsx, createImportTemplate, XLSX_MIME } from "./asset-import-xlsx-template.ts";

// Only executable checks use these small contract fixtures; product data comes from Core.
const OPTIONS: ImportOptions = {
  ready: true, reason: null,
  file: { extensions: [".xlsx", ".csv"], mimeTypes: [XLSX_MIME, "text/csv"], maxBytes: 10485760, maxRows: 5000, sourceFilePurpose: "import_source" },
  chunks: { rowsPerRequest: 1000, confirmRowsPerRequest: 100 },
  columns: [
    { key: "name", label: "Asset Name", required: true, example: "จอภาพ" },
    { key: "category", label: "Category", required: true, example: "OFFICE" },
    { key: "location", label: "Location", required: true, example: "HQ" },
    { key: "asset_tag", label: "Asset Tag", required: false, example: "000123" },
    { key: "serial_number", label: "Serial Number", required: false, example: "SN001" },
    { key: "purchase_date", label: "Purchase Date", required: false, example: "2026-05-12" },
    { key: "condition", label: "Condition", required: false, example: "Good" },
    { key: "assignee", label: "Assignee", required: false, example: "" },
    { key: "notes", label: "Notes", required: false, example: "=1+1" },
  ],
  referenceMatching: { category: ["code", "name"], location: ["code", "path", "name"], locationPathSeparator: " > ", assignee: ["email"], ambiguous: "error" },
  conditions: ["Good", "Fair", "Damaged"], conditionsByStatus: { Available: ["Good", "Fair"], Assigned: ["Good", "Fair", "Damaged"] },
  defaultCondition: "Good", dateFormat: "YYYY-MM-DD",
  tagGeneration: { modes: ["automatic", "manual"], prefix: "AST", sequenceDigits: 6, format: "AST-######", allocatedOn: "create", reservesTag: false },
  serialOverride: { field: "override_reason", maxLength: 1000, reasonIsConfirmation: true },
  referenceSelectors: { categories: "/categories", locations: "/locations", orgUnits: "/org-units", persons: "/persons" },
  registeredAssetsPath: "/assets/list?import_batch_id={batchId}",
};
const context = { tenantId: "11111111-1111-4111-8111-111111111111", userId: "22222222-2222-4222-8222-222222222222" };

function xlsxFile(first: WorkSheet, date1904 = false, name = "assets.xlsx"): File {
  const workbook = utils.book_new();
  workbook.Workbook = { WBProps: { date1904 } };
  utils.book_append_sheet(workbook, first, "Assets");
  utils.book_append_sheet(workbook, utils.aoa_to_sheet([["Ignored"], ["Reference only"]]), "Reference");
  return new File([write(workbook, { type: "array", bookType: "xlsx" })], name, { type: XLSX_MIME });
}

async function fails(file: File, code: ParseError["code"], options = OPTIONS) {
  await assert.rejects(
    () => parseImportFile(file, options),
    (error) => error instanceof ParseError && error.code === code,
  );
}

async function readBlob(blob: Blob): Promise<WorkBook> {
  return read(await blob.arrayBuffer(), { type: "array", cellNF: true });
}

async function parserChecks() {
  const sheet = utils.aoa_to_sheet([
    [], [],
    ["Asset Name *", "Purchase Date", "Asset Tag", "Serial Number", "Notes", "Cached formula", "No cached result", "Flag"],
    [" จอภาพ ไทย ", (Date.UTC(2026, 4, 12) - Date.UTC(1899, 11, 30)) / 86400000, "000123", 1e21, "สอง\nบรรทัด", 0, "", false],
    [],
    ["Desk", "12/05/2026", -1.23e-7, 0],
  ]);
  sheet.B4.z = "m/d/yyyy";
  sheet.F4 = { t: "n", v: 42, f: "6*7" };
  sheet.G4 = { t: "n", f: "1+1" };
  const file = xlsxFile(sheet, false, "ไทย.XLSX");
  const parsed = await parseImportFile(file, OPTIONS);
  assert.equal(parsed.file, file, "upload must keep the original file bytes");
  assert.equal(parsed.kind, "xlsx");
  assert.equal(parsed.columnCount, 8);
  assert.deepEqual(parsed.rows.map((row) => row.rowIndex), [4, 6]);
  assert.deepEqual(parsed.rows[0].cells, ["จอภาพ ไทย", "2026-05-12", "000123", "1000000000000000000000", "สอง\nบรรทัด", "42", "", "false"]);
  assert.deepEqual(parsed.rows[1].cells, ["Desk", "12/05/2026", "-0.000000123", "0"]);

  const errorCell = utils.aoa_to_sheet([["Name", "Notes"], ["Desk"]]);
  errorCell.B2 = { t: "e", v: 7, f: "1/0" };
  errorCell["!ref"] = "A1:B2";
  assert.equal((await parseImportFile(xlsxFile(errorCell), OPTIONS)).rows[0].cells[1], "#DIV/0!",
    "saved Excel errors remain values; unmapped columns must not prevent reading a workbook");

  const mac = utils.aoa_to_sheet([["Name", "Date"], ["Mac workbook", (Date.UTC(2026, 4, 12) - Date.UTC(1904, 0, 1)) / 86400000]]);
  mac.B2.z = "yyyy-mm-dd";
  assert.equal((await parseImportFile(xlsxFile(mac, true), OPTIONS)).rows[0].cells[1], "2026-05-12");
  const leadingColumn = utils.aoa_to_sheet([[null, "Name"], [null, "Desk"]]);
  assert.deepEqual((await parseImportFile(xlsxFile(leadingColumn), OPTIONS)).headers, ["", "Name"]);

  const importId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const errorSheet = utils.aoa_to_sheet([["Name", "Import ID", "Source Row"], ["Fix", importId.toUpperCase(), 200]]);
  const reimport = await parseImportFile(xlsxFile(errorSheet), OPTIONS);
  assert.deepEqual(reimport.reimport, { originalImportId: importId, sourceRowColumn: 2 });
  assert.equal(reimport.rows[0].cells[2], "200");
  utils.sheet_add_aoa(errorSheet, [["Other", context.tenantId, 201]], { origin: "A3" });
  await fails(xlsxFile(errorSheet), "MIXED_IMPORT");
  await fails(xlsxFile(utils.aoa_to_sheet([["Name"]])), "EMPTY");
  await fails(xlsxFile(utils.aoa_to_sheet([])), "EMPTY", OPTIONS);
  await fails(new File(["%PDF-1.7"], "renamed.xlsx"), "UNREADABLE");
  await fails(new File(["Name\nDesk"], "renamed.xlsx"), "UNREADABLE");
  await fails(new File([new Uint8Array([0x50, 0x4b, 3, 4, 0])], "broken.xlsx"), "UNREADABLE");
  const ods = utils.book_new();
  utils.book_append_sheet(ods, sheet, "Assets");
  await fails(new File([write(ods, { type: "array", bookType: "ods" })], "renamed.xlsx"), "UNREADABLE");
  await fails(file, "TYPE", { ...OPTIONS, file: { ...OPTIONS.file, extensions: [".csv"] } });
  await fails(file, "SIZE", { ...OPTIONS, file: { ...OPTIONS.file, maxBytes: file.size - 1 } });

  const limitSheet = utils.aoa_to_sheet([["Name"], ...Array.from({ length: 5000 }, (_, i) => [`Item ${i}`])]);
  assert.equal((await parseImportFile(xlsxFile(limitSheet), OPTIONS)).rows.length, 5000);
  utils.sheet_add_aoa(limitSheet, [["One too many"]], { origin: "A5002" });
  await assert.rejects(() => parseImportFile(xlsxFile(limitSheet), OPTIONS), (error) =>
    error instanceof ParseError && error.code === "TOO_MANY_ROWS" && error.message.includes("5,001"));
}

async function templateChecks() {
  const blob = await buildTemplateXlsx(OPTIONS, {
    categories: [
      { code: "OFFICE", name: "อุปกรณ์สำนักงาน", active: true, serialRequired: true },
      { code: "OLD", name: "Inactive", active: false, serialRequired: false },
    ],
    locations: [{ code: null, path: "HQ > ชั้น 1" }],
  });
  const workbook = await readBlob(blob);
  assert.equal(blob.type, XLSX_MIME);
  assert.deepEqual(workbook.SheetNames, ["Assets", "Reference"]);
  assert.deepEqual(utils.sheet_to_json(workbook.Sheets.Assets, { header: 1, blankrows: false })[0],
    OPTIONS.columns.map((column) => column.required ? `${column.label} *` : column.label));
  assert.equal(workbook.Sheets.Assets.F2.t, "s");
  assert.equal(workbook.Sheets.Assets.F2.z, "@");
  assert.equal(workbook.Sheets.Assets.F5001.z, "@", "new data rows retain text date formatting");
  assert.equal(workbook.Sheets.Assets.I2.v, "=1+1");
  assert.equal(workbook.Sheets.Assets.I2.f, undefined, "examples never become formulas");
  const reference = utils.sheet_to_csv(workbook.Sheets.Reference);
  assert.ok(reference.includes("อุปกรณ์สำนักงาน"));
  assert.ok(reference.includes("HQ > ชั้น 1"));
  assert.equal(reference.includes("Inactive"), false);
  const roundTrip = await parseImportFile(new File([blob], "asset-import-template.xlsx"), OPTIONS);
  assert.equal(roundTrip.rows.length, 1, "text-formatted blank date cells are not data rows");
  assert.equal(roundTrip.columnCount, 9);

  const calls: string[] = [];
  const complete = await createImportTemplate(OPTIONS, context, async (header, kind, query) => {
    assert.equal(header, `${context.tenantId}:${context.userId}`);
    calls.push(`${kind}:${query.parentId ?? "root"}:${query.page}`);
    const items = query.parentId ? [] : kind === "categories"
      ? [{ id: `category-${query.page}`, name: `Category ${query.page}`, code: `CAT${query.page}`, is_serial_required: false }]
      : [{ id: "hq", name: "HQ", code: "HQ" }];
    const hasMore = kind === "categories" && !query.parentId && query.page === 1;
    return { items, pageSize: 50, page: query.page, hasMore, nextPage: hasMore ? 2 : null };
  });
  assert.equal(complete.filename, "asset-import-template.xlsx");
  assert.equal(complete.referenceUnavailable, false);
  assert.ok(calls.includes("categories:root:2"));
  const completeWorkbook = await readBlob(complete.blob);
  assert.ok(utils.sheet_to_csv(completeWorkbook.Sheets.Reference).includes("CAT2"));

  const fallback = await createImportTemplate(OPTIONS, context, async () => { throw new Error("Unavailable"); });
  assert.equal(fallback.referenceUnavailable, true);
  assert.deepEqual((await readBlob(fallback.blob)).SheetNames, ["Assets"]);
  assert.equal((await parseImportFile(new File([fallback.blob], fallback.filename), OPTIONS)).rows.length, 1);
}

await parserChecks();
await templateChecks();
console.log("Bulk import XLSX parser and template checks passed.");
