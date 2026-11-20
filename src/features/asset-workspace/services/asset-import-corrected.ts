import type { ColumnMapping, ImportRow, ParsedImportRows } from "../domain/asset-import-types.ts";
import { readImportCsv } from "./asset-import-parse.ts";
import { readImportXlsx } from "./asset-import-xlsx.ts";

type CellEdit = { row: number; column: number; value: string };

function correctedCells(parsed: ParsedImportRows, mapping: ColumnMapping, rows: ImportRow[]): CellEdit[] {
  if (!mapping.some(Boolean) || mapping.length !== parsed.headers.length) throw new Error("Import mapping unavailable.");
  const source = new Map(parsed.rows.map((row) => [row.rowIndex, row.cells]));
  const edits: CellEdit[] = [];
  for (const row of rows) {
    if (!row.editedAt) continue;
    const original = source.get(row.rowIndex);
    if (!original) throw new Error("An edited row is missing from the source file.");
    mapping.forEach((field, column) => {
      if (!field) return;
      const value = row.values[field] ?? "";
      // Saved rows contain all fields; leave unchanged source cells (including formulas) intact.
      if (value !== (original[column] ?? "")) edits.push({ row: row.rowIndex - 1, column, value });
    });
  }
  return edits;
}

/** Keep CSV bytes outside edited fields, including quoting, blank lines, whitespace and delimiter. */
function correctCsv(bytes: ArrayBuffer, edits: CellEdit[]): string {
  const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
  const first = text.replace(/^\uFEFF/, "").split(/\r\n|\r|\n/).find((line) => line.trim()) ?? "";
  const delimiter = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const byRow = new Map<number, CellEdit[]>();
  for (const edit of edits) byRow.set(edit.row, [...byRow.get(edit.row) ?? [], edit]);
  let row = 0;
  let start = text.startsWith("\uFEFF") ? 1 : 0;
  let quoted = false;
  let cells: { start: number; end: number }[] = [];
  const replacements: { start: number; end: number; value: string }[] = [];
  function endRow(end: number) {
    cells.push({ start, end });
    const changes = byRow.get(row);
    if (changes) {
      const values = cells.map((cell) => text.slice(cell.start, cell.end));
      for (const edit of changes) {
        while (values.length <= edit.column) values.push("");
        // A leading ' stops Excel running the edit as a formula; the CSV reader removes it again.
        const value = /^[=+\-@\t\r]/.test(edit.value) ? `'${edit.value}` : edit.value;
        values[edit.column] = `"${value.replaceAll('"', '""')}"`;
      }
      replacements.push({ start: cells[0].start, end, value: values.join(delimiter) });
    }
    cells = [];
    row += 1;
  }
  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (!quoted && character === delimiter) {
      cells.push({ start, end: index }); start = index + 1;
    } else if (!quoted && (character === "\r" || character === "\n")) {
      endRow(index);
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      start = index + 1;
    }
  }
  if (start < text.length || cells.length) endRow(text.length);
  let result = text;
  for (const edit of replacements.reverse()) result = result.slice(0, edit.start) + edit.value + result.slice(edit.end);
  return result;
}

export async function buildCorrectedImport(bytes: ArrayBuffer, name: string, mapping: ColumnMapping,
  rows: ImportRow[], progress: (label: string) => void = () => {}) {
  const csv = /\.csv$/i.test(name);
  progress("Reading source file…");
  const parsed = csv ? readImportCsv(bytes, 5000) : await readImportXlsx(bytes, 5000);
  const edits = correctedCells(parsed, mapping, rows);
  progress("Applying saved edits…");
  // Yield before synchronous SheetJS work so the progress message can paint.
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  let blob: Blob;
  if (csv) {
    blob = new Blob([correctCsv(bytes, edits)], { type: "text/csv;charset=utf-8" });
  } else {
    const { read, write, utils } = await import("xlsx");
    const workbook = read(bytes, { type: "array", cellNF: true, cellFormula: true, cellDates: false, sheetStubs: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    for (const edit of edits) {
      const address = utils.encode_cell({ r: edit.row, c: edit.column });
      sheet[address] = { t: "s", v: edit.value };
    }
    blob = new Blob([write(workbook, { type: "array", bookType: "xlsx" })], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }
  progress("Downloading corrected file…");
  return { blob, filename: name.replace(/(\.[^.]+)$/, "-corrected$1") };
}
