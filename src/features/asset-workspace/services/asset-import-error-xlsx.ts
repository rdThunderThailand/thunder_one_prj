import { readImportCsv } from "./asset-import-parse.ts";
import { XLSX_MIME } from "./asset-import-xlsx-template.ts";

/** Core only sends CSV. Every cell stays text, so IDs, dates and formula-looking values are not reinterpreted. */
export async function errorFileAsXlsx(file: { blob: Blob; filename: string }) {
  const { headers, rows } = readImportCsv(await file.blob.arrayBuffer(), Number.POSITIVE_INFINITY);
  const { utils, write } = await import("xlsx");
  const workbook = utils.book_new();
  const sheet = utils.aoa_to_sheet([headers, ...rows.map((row) => row.cells)]);
  sheet["!cols"] = headers.map((header) => ({ wch: Math.max(header.length + 3, 22) }));
  utils.book_append_sheet(workbook, sheet, "Errors");
  const bytes: ArrayBuffer = write(workbook, { bookType: "xlsx", type: "array", compression: true });
  return {
    blob: new Blob([bytes], { type: XLSX_MIME }),
    filename: file.filename.replace(/\.csv$/i, ".xlsx"),
  };
}
