import {
  IMPORT_FIELD_KEYS,
  type ColumnMapping,
  type ImportColumn,
  type ImportFieldKey,
  type ParsedImportFile,
  type SendRow,
} from "./asset-import-types.ts";

export const FIELD_ALIASES: Record<ImportFieldKey, string[]> = {
  name: ["asset name", "name"],
  category: ["category"],
  location: ["location", "site"],
  asset_tag: ["asset tag", "asset tag / id", "tag", "asset_tag"],
  serial_number: ["serial no.", "serial number", "serial", "serial_number"],
  purchase_date: ["purchase date", "acquisition date", "purchase_date"],
  condition: ["condition"],
  assignee: ["assignee", "custodian", "assigned to"],
  notes: ["notes", "remark"],
};

export const NON_MAPPABLE_HEADERS = [
  "import id",
  "source row",
  "error code",
  "error message",
  "result",
  "created asset tag",
  "created asset id",
  "messages",
  "override reason",
];

export function normalizeHeader(header: string): string {
  return header
    .trim()
    .replace(/\*$/, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function autoMap(headers: string[]): ColumnMapping {
  const used = new Set<ImportFieldKey>();

  return headers.map((header) => {
    const normalized = normalizeHeader(header);
    if (NON_MAPPABLE_HEADERS.includes(normalized)) return null;

    const field = IMPORT_FIELD_KEYS.find(
      (key) => !used.has(key) && FIELD_ALIASES[key].includes(normalized),
    );
    if (!field) return null;

    used.add(field);
    return field;
  });
}

export function setMapping(
  mapping: ColumnMapping,
  column: number,
  field: ImportFieldKey | null,
): ColumnMapping {
  if (!Number.isInteger(column) || column < 0 || column >= mapping.length) {
    throw new RangeError("The column is outside the mapping.");
  }

  return mapping.map((current, index) => {
    if (index === column) return field;
    return field !== null && current === field ? null : current;
  });
}

export function missingRequired(
  mapping: ColumnMapping,
  columns: ImportColumn[],
): ImportFieldKey[] {
  return columns
    .filter((column) => column.required && !mapping.includes(column.key))
    .map((column) => column.key);
}

export function ignoredHeaders(
  headers: string[],
  mapping: ColumnMapping,
): string[] {
  return headers.filter((header, index) => {
    if (mapping[index]) return false;
    return !NON_MAPPABLE_HEADERS.includes(normalizeHeader(header));
  });
}

export function buildSendRows(
  file: ParsedImportFile,
  mapping: ColumnMapping,
): SendRow[] {
  return file.rows.map((row) => {
    const values: SendRow["values"] = {};
    mapping.forEach((field, column) => {
      if (
        field !== null &&
        !NON_MAPPABLE_HEADERS.includes(
          normalizeHeader(file.headers[column] ?? ""),
        )
      ) {
        values[field] = row.cells[column] ?? "";
      }
    });

    const result: SendRow = { row_index: row.rowIndex, values };
    if (file.reimport) {
      const raw = (row.cells[file.reimport.sourceRowColumn] ?? "").trim();
      if (/^[1-9]\d*$/.test(raw)) {
        const parsed = Number(raw);
        if (Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 1048576) {
          result.original_row_index = parsed;
        }
      }
    }
    return result;
  });
}

export function firstTooLongCell(
  file: ParsedImportFile,
  mapping: ColumnMapping,
): number | null {
  for (const row of file.rows) {
    for (let column = 0; column < mapping.length; column += 1) {
      const field = mapping[column];
      if (
        field !== null &&
        !NON_MAPPABLE_HEADERS.includes(
          normalizeHeader(file.headers[column] ?? ""),
        )
      ) {
        if ((row.cells[column] ?? "").length > 5000) {
          return row.rowIndex;
        }
      }
    }
  }
  return null;
}

export function chunk<T>(items: T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError("The chunk size must be a positive integer.");
  }

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
