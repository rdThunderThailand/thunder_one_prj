import type { ImportOptions } from "../domain/asset-import-types.ts";
import type { AssetImportContext } from "./asset-import-api.ts";
import {
  loadImportReferences,
  templateRows,
  type ImportReferences,
  type ReferencePageFetcher,
} from "./asset-import-template.ts";

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export type ImportTemplateStage = "references" | "workbook";

export async function buildTemplateXlsx(
  options: ImportOptions,
  references: ImportReferences | null,
): Promise<Blob> {
  const { utils, write } = await import("xlsx");
  const workbook = utils.book_new();
  // Strings also keep identifiers, dates and formula-looking examples as literal text.
  const assets = utils.aoa_to_sheet(templateRows(options));
  assets["!cols"] = options.columns.map((column) => ({
    wch: Math.max(column.label.length + 3, 22),
  }));
  const dateColumn = options.columns.findIndex((column) => column.key === "purchase_date");
  if (dateColumn !== -1) {
    // Preformat the supported input rows as text, including cells the user fills later.
    for (let row = 1; row <= options.file.maxRows; row += 1) {
      const address = utils.encode_cell({ r: row, c: dateColumn });
      assets[address] = { t: "s", v: assets[address]?.v ?? "", z: "@" };
    }
    const range = utils.decode_range(assets["!ref"]!);
    range.e.r = Math.max(range.e.r, options.file.maxRows);
    assets["!ref"] = utils.encode_range(range);
  }
  utils.book_append_sheet(workbook, assets, "Assets");

  if (references) {
    // Existing selectors expose one localized name; don't invent a second language.
    const rows = [
      ["Categories"],
      ["Code", "Name", "Serial required"],
      ...references.categories.filter((category) => category.active).map((category) => [
        category.code, category.name, category.serialRequired ? "Yes" : "No",
      ]),
      [],
      ["Locations"],
      ["Code", "Full path"],
      ...references.locations.map((location) => [location.code ?? "", location.path]),
    ];
    const referenceSheet = utils.aoa_to_sheet(rows);
    referenceSheet["!cols"] = [{ wch: 24 }, { wch: 60 }, { wch: 22 }];
    utils.book_append_sheet(workbook, referenceSheet, "Reference");
  }

  const bytes: ArrayBuffer = write(workbook, { bookType: "xlsx", type: "array", compression: true });
  return new Blob([bytes], { type: XLSX_MIME });
}

/** Selector failures must not block downloading the blank Assets template. */
export async function createImportTemplate(
  options: ImportOptions,
  context: AssetImportContext,
  fetcher?: ReferencePageFetcher,
  onStage?: (stage: ImportTemplateStage) => void | Promise<void>,
): Promise<{ blob: Blob; filename: string; referenceUnavailable: boolean }> {
  let references: ImportReferences | null = null;
  await onStage?.("references");
  try {
    references = await loadImportReferences(context, fetcher);
  } catch {
    // The caller reports the missing reference sheet; never export a partial hierarchy.
  }
  await onStage?.("workbook");
  return {
    blob: await buildTemplateXlsx(options, references),
    filename: "asset-import-template.xlsx",
    referenceUnavailable: references === null,
  };
}
