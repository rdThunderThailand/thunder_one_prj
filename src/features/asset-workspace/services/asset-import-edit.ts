import { z } from "zod";
import type { ImportCheckResult, ImportEditResult, ImportRowPatch } from "../domain/asset-import-edit.ts";
import type { ImportRow } from "../domain/asset-import-types.ts";
import type { AssetImportApi } from "./asset-import-api.ts";
import { parseImportResponse } from "./asset-import-api.ts";
import { rowMessageSchema } from "./asset-import-contract.ts";
import { importFieldKeySchema } from "./asset-import-options-contract.ts";
import type { ImportJsonCaller } from "./asset-import-transport.ts";

// PATCH returns validation rows, without the result/custody fields supplied by GET rows.
const editedRow = z.object({
  id: z.uuid(), rowIndex: z.number().int().positive(), values: z.partialRecord(importFieldKeySchema, z.string()),
  version: z.number().int().positive(), editedAt: z.string().nullable(),
  severity: z.enum(["valid", "warning", "error"]), messages: z.array(rowMessageSchema),
  errorCode: z.string().nullable(), errorMessage: z.string().nullable(),
}).transform((row): ImportRow => ({ ...row, result: null, createdAsset: null, override: null, originalRowIndex: null }));
const editResult = z.object({
  row: editedRow, affectedRows: z.array(editedRow), editedCount: z.number().int().nonnegative(),
  counts: z.object({ total: z.number().int().nonnegative(), valid: z.number().int().nonnegative(),
    warning: z.number().int().nonnegative(), error: z.number().int().nonnegative() }),
});
const checkResult = z.object({ severity: z.enum(["valid", "warning", "error"]), messages: z.array(rowMessageSchema) });

export function createImportEditApi(call: ImportJsonCaller) {
  const path = (batchId: string, rowId: string) =>
    `/imports/${encodeURIComponent(batchId.toLowerCase())}/rows/${encodeURIComponent(rowId.toLowerCase())}`;
  return {
    async saveRow(batchId: string, rowId: string, body: ImportRowPatch): Promise<ImportEditResult> {
      return parseImportResponse(editResult, await call("PATCH", path(batchId, rowId), body));
    },
    async checkRow(batchId: string, rowId: string, values: ImportRow["values"], signal: AbortSignal): Promise<ImportCheckResult> {
      return parseImportResponse(checkResult, await call("POST", `${path(batchId, rowId)}/check`, { values }, signal));
    },
  };
}

// Core's largest rows page.
const ALL_ROWS_PAGE = 1000;

/** Read every row: apply counts, next issue and export must not stop at the visible page. */
export async function readAllImportRows(api: AssetImportApi, batchId: string, signal?: AbortSignal): Promise<ImportRow[]> {
  const read = async (page: number) => {
    signal?.throwIfAborted();
    const result = await api.listRows(batchId, { page, pageSize: ALL_ROWS_PAGE }, signal);
    signal?.throwIfAborted();
    return result;
  };
  const first = await read(1);
  const pages = Math.ceil(first.total / ALL_ROWS_PAGE);
  const rest = await Promise.all(Array.from({ length: Math.max(0, pages - 1) }, (_, index) => read(index + 2)));
  const rows = [first, ...rest].flatMap((page) => page.rows);
  if (rows.length !== first.total) throw new Error("The import rows could not be read completely.");
  return rows;
}
