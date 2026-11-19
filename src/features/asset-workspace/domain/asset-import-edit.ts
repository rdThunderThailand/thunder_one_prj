import { IMPORT_FIELD_KEYS, type ImportFieldKey, type ImportRow, type RowMessage } from "./asset-import-types.ts";

export type ImportValues = ImportRow["values"];
export type ImportPicker = "category" | "location" | "assignee";
export type ImportRowPatch = {
  values: ImportValues;
  version: number;
  apply_to_same_value?: { field: ImportPicker; from: string };
};
export type ImportEditResult = {
  row: ImportRow;
  affectedRows: ImportRow[];
  counts: { total: number; valid: number; warning: number; error: number };
  editedCount: number;
};
export type ImportCheckResult = { severity: ImportRow["severity"]; messages: RowMessage[] };

export function importChanges(original: ImportValues, draft: ImportValues): ImportValues {
  return Object.fromEntries(IMPORT_FIELD_KEYS.filter((key) =>
    (original[key] ?? "") !== (draft[key] ?? ""),
  ).map((key) => [key, draft[key] ?? ""]));
}

export function isImportPicker(field: ImportFieldKey): field is ImportPicker {
  return ["category", "location", "assignee"].includes(field);
}

export function sameValueRows(rows: ImportRow[], row: ImportRow, field: ImportPicker): number {
  const from = (row.values[field] ?? "").trim();
  return rows.filter((other) => other.id !== row.id && (other.values[field] ?? "").trim() === from).length;
}

export function importPatch(row: ImportRow, draft: ImportValues, apply: ImportPicker | null): ImportRowPatch {
  if (!row.version) throw new Error("Reload this row before editing.");
  const values = importChanges(row.values, draft);
  return {
    values, version: row.version,
    ...(apply && Object.hasOwn(values, apply)
      ? { apply_to_same_value: { field: apply, from: row.values[apply] ?? "" } } : {}),
  };
}
