import { z } from "zod";
import { normalizeHeader } from "../domain/asset-import-mapping.ts";
import { parseErrorText } from "../domain/asset-import-messages.ts";
import type { ImportOptions, ParsedImportFile, ParsedImportRows } from "../domain/asset-import-types.ts";

type ParseErrorCode =
  | "TYPE"
  | "SIZE"
  | "ENCODING"
  | "EMPTY"
  | "TOO_MANY_ROWS"
  | "MIXED_IMPORT"
  | "UNREADABLE";

export class ParseError extends Error {
  code: ParseErrorCode;

  constructor(code: ParseErrorCode, message: string) {
    super(message);
    this.name = "ParseError";
    this.code = code;
  }
}

function unreadable(): never {
  throw new ParseError("UNREADABLE", parseErrorText("UNREADABLE"));
}

/** Quotes may contain physical newlines; only record boundaries advance sheet rows. */
function readCsv(text: string, delimiter: string, maxRows: number): ParsedImportRows {
  let headers: string[] = [];
  const rows: ParsedImportFile["rows"] = [];
  let cells: string[] = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;
  let rowIndex = 0;
  let totalRows = 0;

  function finishField() {
    cells.push(field.trim());
    field = "";
    closedQuote = false;
  }

  function finishRow() {
    finishField();
    rowIndex += 1;
    if (cells.some((cell) => cell !== "")) {
      if (headers.length === 0) {
        headers = cells;
      } else {
        totalRows += 1;
        if (totalRows <= maxRows) {
          rows.push({ rowIndex, cells });
        }
      }
    }
    cells = [];
  }

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === delimiter) {
      finishField();
    } else if (character === "\r" || character === "\n") {
      finishRow();
      if (character === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
    } else if (character === '"') {
      if (field !== "" || closedQuote) unreadable();
      quoted = true;
    } else {
      if (closedQuote) unreadable();
      field += character;
    }
  }

  if (quoted) unreadable();
  if (cells.length > 0 || field !== "" || closedQuote) finishRow();
  return { headers, rows, totalRows };
}

function reimportFor(data: ParsedImportRows): ParsedImportFile["reimport"] {
  const headers = data.headers.map(normalizeHeader);
  const importIdColumn = headers.indexOf("import id");
  const sourceRowColumn = headers.indexOf("source row");
  if (importIdColumn === -1 || sourceRowColumn === -1) return null;

  const ids = new Set(
    data.rows.map((row) => (row.cells[importIdColumn] ?? "").trim().toLowerCase()),
  );
  const originalImportId = z.uuid().safeParse(ids.values().next().value);
  if (ids.size !== 1 || !originalImportId.success) {
    throw new ParseError("MIXED_IMPORT", parseErrorText("MIXED_IMPORT"));
  }
  return { originalImportId: originalImportId.data, sourceRowColumn };
}

export async function parseImportFile(
  file: File,
  options: ImportOptions,
): Promise<ParsedImportFile> {
  const extension = /\.[^.]+$/.exec(file.name)?.[0].toLowerCase();
  if (
    (extension !== ".csv" && extension !== ".xlsx") ||
    !options.file.extensions.includes(extension)
  ) {
    throw new ParseError("TYPE", parseErrorText("TYPE"));
  }
  if (file.size > options.file.maxBytes) {
    throw new ParseError("SIZE", parseErrorText("SIZE"));
  }
  try {
    const bytes = await file.arrayBuffer();
    const kind = extension === ".xlsx" ? "xlsx" : "csv";
    let data: ParsedImportRows;
    if (kind === "xlsx") {
      const { readImportXlsx } = await import("./asset-import-xlsx.ts");
      data = await readImportXlsx(bytes, options.file.maxRows);
    } else {
      data = readImportCsv(bytes, options.file.maxRows);
    }

    if (data.totalRows === 0) {
      throw new ParseError("EMPTY", parseErrorText("EMPTY"));
    }
    if (data.totalRows > options.file.maxRows) {
      throw new ParseError("TOO_MANY_ROWS", parseErrorText("TOO_MANY_ROWS", data.totalRows));
    }
    return {
      file,
      name: file.name,
      sizeBytes: file.size,
      kind,
      headers: data.headers,
      rows: data.rows,
      columnCount: data.headers.length,
      reimport: reimportFor(data),
    };
  } catch (error) {
    if (error instanceof ParseError) throw error;
    return unreadable();
  }
}

export function readImportCsv(bytes: ArrayBuffer, maxRows: number): ParsedImportRows {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true })
      .decode(bytes)
      .replace(/^\uFEFF/, "");
  } catch {
    throw new ParseError("ENCODING", parseErrorText("ENCODING"));
  }

  const firstLine = text.split(/\r\n|\r|\n/).find((line) => line.trim() !== "") ?? "";
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";
  return readCsv(text, delimiter, maxRows);
}
