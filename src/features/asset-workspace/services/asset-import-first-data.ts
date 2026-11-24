// The import page's first data, read from Core on the server. Server-only.
// The reads are not awaited: the page is sent first and the step shows when they are ready.
import { z } from "zod";
import type { ImportBatch, ImportOptions } from "../domain/asset-import-types";
import { importBatchSchema, importOptionsSchema } from "./asset-import-contract";
import { assetServerReader } from "./asset-server-read";
import type { SectionSeed } from "./assets-list-seed";

export interface ImportFirstData {
  options: SectionSeed<ImportOptions>;
  /** Only for a link to one import. */
  batch?: SectionSeed<ImportBatch>;
}

export async function startImportFirstData(token: string, tenantId: string, userId: string, batchId?: string | string[]): Promise<ImportFirstData> {
  const read = await assetServerReader(token, tenantId);
  const key = `${tenantId}:${userId}`;
  const at = Date.now();
  const options = { key, at, data: read("/imports/options", importOptionsSchema) };
  const id = z.uuid().safeParse(batchId);
  if (!id.success) return { options };
  const batch = read(`/imports/${id.data.toLowerCase()}`, importBatchSchema)
    .then((batch) => batch?.id === id.data.toLowerCase() ? batch : null);
  return { options, batch: { key: `${key}:${id.data}`, at, data: batch } };
}
