import type { ImportBatch, ImportOptions, ParsedImportFile } from "../domain/asset-import-types.ts";
import type { AssetImportApi } from "./asset-import-api.ts";
import { parseImportFile } from "./asset-import-parse.ts";

/** Core keeps the uploaded file, so a reload reads that copy instead of storing it in the browser. */
export async function restoreImportFile(
  api: AssetImportApi,
  batch: ImportBatch,
  options: ImportOptions,
  signal: AbortSignal,
): Promise<ParsedImportFile> {
  const source = await api.sourceFileUrl(batch.id);
  const response = await fetch(source.url, { signal, credentials: "omit", cache: "no-store" });
  if (!response.ok) throw new Error("The source file could not be downloaded.");
  const blob = await response.blob();
  const expected = batch.sourceFile?.sizeBytes;
  if (typeof expected === "number" && blob.size !== expected) {
    throw new Error("The source file does not match this import.");
  }
  const file = new File([blob], source.name, { type: batch.sourceFile?.mimeType ?? blob.type });
  return parseImportFile(file, options);
}
