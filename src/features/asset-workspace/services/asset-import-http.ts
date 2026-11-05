import { z } from "zod";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import {
  ImportApiError,
  parseImportResponse,
  type AssetImportApi,
  type AssetImportContext,
} from "./asset-import-api.ts";
import {
  createBatchResultSchema,
  importBatchSchema,
  importOptionsSchema,
} from "./asset-import-contract.ts";

import { uploadImportSource } from "./asset-import-source-upload.ts";
import {
  createImportJsonCaller, defaultRequester,
  type ImportHttpRequester,
} from "./asset-import-transport.ts";

// Keep the established imports used by existing check scripts and callers.
export type { ImportHttpRequester, ImportHttpResponse } from "./asset-import-transport.ts";

export function createHttpImportApi(
  context: AssetImportContext,
  requester: ImportHttpRequester = defaultRequester,
): AssetImportApi {
  const callJson = createImportJsonCaller(context, requester);

  return {
    async getOptions() {
      const data = await callJson("GET", "/imports/options");
      return parseImportResponse(importOptionsSchema, data);
    },

    uploadSource(input) {
      return uploadImportSource(input, callJson);
    },

    async createBatch(input) {
      const data = await callJson("POST", "/imports", {
        batch_id: input.batchId.toLowerCase(),
        source_upload_id: input.sourceUploadId.toLowerCase(),
        total_rows: input.totalRows,
        ...(input.originalImportId ? { original_import_id: input.originalImportId.toLowerCase() } : {}),
      });
      const created = parseImportResponse(createBatchResultSchema, data);
      if (created.batchId !== input.batchId.toLowerCase() || created.totalRows !== input.totalRows) {
        throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE"), 502);
      }
      return {
        batchId: created.batchId,
        batchCode: created.batchCode,
        replayed: created.replayed,
      };
    },

    async discard(batchId) {
      const data = await callJson(
        "DELETE",
        `/imports/${encodeURIComponent(batchId.toLowerCase())}`,
      );
      parseImportResponse(z.object({ deleted: z.literal(true) }), data);
    },

    async getBatch(batchId) {
      const data = await callJson("GET", `/imports/${encodeURIComponent(batchId.toLowerCase())}`);
      const batch = parseImportResponse(importBatchSchema, data);
      if (batch.id !== batchId.toLowerCase()) {
        throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE"), 502);
      }
      return batch;
    },

  };
}
