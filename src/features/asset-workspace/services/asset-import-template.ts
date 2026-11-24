import type { ImportOptions } from "../domain/asset-import-types.ts";

export type ReferenceCategoryRow = {
  code: string;
  name: string;
  serialRequired: boolean;
  active: boolean;
};

export type ReferenceLocationRow = {
  code: string | null;
  path: string;
};

export type ImportReferences = {
  categories: ReferenceCategoryRow[];
  locations: ReferenceLocationRow[];
};

export function csvCell(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const formulaSafe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\r\n]/.test(formulaSafe) || formulaSafe.startsWith("'")) {
    return `"${formulaSafe.replace(/"/g, '""')}"`;
  }
  return formulaSafe;
}

export function buildCsv(rows: unknown[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function buildTemplateCsv(options: ImportOptions): string {
  return buildCsv(templateRows(options));
}

export function templateRows(options: ImportOptions): string[][] {
  const headers = options.columns.map((column) =>
    column.required ? `${column.label} *` : column.label,
  );
  const exampleRow = options.columns.map((column) => column.example);
  return [headers, exampleRow];
}

export function buildReferenceCsv(
  categories: ReferenceCategoryRow[],
  locations: ReferenceLocationRow[],
): string {
  const rows: unknown[][] = [
    ["Type", "Code", "Name / Full Path", "Serial Required"],
    ...categories
      .filter((category) => category.active)
      .map((category) => [
        "Category",
        category.code,
        category.name,
        category.serialRequired ? "Yes" : "No",
      ]),
    ...locations.map((location) => ["Location", location.code ?? "", location.path, ""]),
  ];
  return buildCsv(rows);
}

export async function loadReferenceCsv(
  readReferences: () => Promise<ImportReferences>,
): Promise<string> {
  const { categories, locations } = await readReferences();
  return buildReferenceCsv(categories, locations);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
