import type { CellObject } from "xlsx";
import type { ParsedImportRows } from "../domain/asset-import-types.ts";

/** JS numeric cells are already numbers; expand their exponent without adding precision. */
function numberText(value: number): string {
  if (!Number.isFinite(value)) throw new Error("Invalid numeric cell");
  const text = String(value);
  const [coefficient, exponent] = text.toLowerCase().split("e");
  if (exponent === undefined) return text;

  const sign = coefficient.startsWith("-") ? "-" : "";
  const [integer, fraction = ""] = coefficient.replace(/^-/, "").split(".");
  const digits = integer + fraction;
  const point = integer.length + Number(exponent);
  if (point <= 0) return `${sign}0.${"0".repeat(-point)}${digits}`;
  if (point >= digits.length) return sign + digits + "0".repeat(point - digits.length);
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
}

/** SheetJS also accepts plain text. Require an actual XLSX package, not a renamed CSV. */
export async function readImportXlsx(
  buffer: ArrayBuffer,
  maxRows: number,
): Promise<ParsedImportRows> {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 3 || bytes[3] !== 4) {
    throw new Error("Not an XLSX package");
  }

  const { read, utils, SSF } = await import("xlsx");
  const workbook = read(bytes, {
    type: "array",
    sheets: 0,
    cellDates: false,
    cellNF: true,
    cellText: false,
    cellFormula: true,
    bookFiles: true,
  });
  // bookFiles exposes package entries, which are not declared in SheetJS's public types.
  const packageFiles = (workbook as typeof workbook & { keys?: string[] }).keys;
  if (!packageFiles?.includes("xl/workbook.xml")) throw new Error("Not an XLSX workbook");
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("Missing first worksheet");
  const date1904 = Boolean(workbook.Workbook?.WBProps?.date1904);

  function cellText(cell: CellObject): string {
    // Read saved formula results only. Never calculate a formula or use its expression.
    if (cell.v === undefined || cell.v === null || cell.t === "z") return "";
    if (cell.t === "e") return utils.format_cell(cell);
    if (typeof cell.v === "number") {
      if (cell.z && SSF.is_date(cell.z)) {
        const date = SSF.parse_date_code(cell.v, { date1904 }) as {
          y: number; m: number; d: number;
        } | null;
        if (date) {
          return `${String(date.y).padStart(4, "0")}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
        }
      }
      return numberText(cell.v);
    }
    return String(cell.v).trim();
  }

  // Iterate populated cells instead of !ref: formatting can inflate a sheet to a million rows.
  const populated = new Map<number, Map<number, CellObject>>();
  for (const [address, cell] of Object.entries(sheet)) {
    if (address.startsWith("!") || !/^[A-Z]+[1-9]\d*$/.test(address)) continue;
    const position = utils.decode_cell(address);
    const row = populated.get(position.r) ?? new Map<number, CellObject>();
    row.set(position.c, cell as CellObject);
    populated.set(position.r, row);
  }

  const result: ParsedImportRows = { headers: [], rows: [], totalRows: 0 };
  for (const rowIndex of [...populated.keys()].sort((a, b) => a - b)) {
    const row = populated.get(rowIndex)!;
    const cells = Array.from({ length: Math.max(...row.keys()) + 1 }, (_, column) => {
      const cell = row.get(column);
      return cell ? cellText(cell) : "";
    });
    if (!cells.some((cell) => cell !== "")) continue;
    if (result.headers.length === 0) {
      result.headers = cells;
    } else {
      result.totalRows += 1;
      if (result.totalRows <= maxRows) result.rows.push({ rowIndex: rowIndex + 1, cells });
    }
  }
  return result;
}
