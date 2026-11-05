import {
  IMPORT_FIELD_KEYS,
  type ColumnMapping,
  type ImportFieldKey,
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
