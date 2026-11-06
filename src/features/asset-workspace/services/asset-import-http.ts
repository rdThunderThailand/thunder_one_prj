import { z } from "zod";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import {
  ImportApiError,
  parseImportResponse,
  type AssetImportApi,
  type AssetImportContext,
} from "./asset-import-api.ts";
import {
  addRowsResultSchema,
  confirmResultSchema,
  confirmRequestSchema,
  createBatchResultSchema,
  importBatchSchema,
  importOptionsSchema,
  rowsPageSchema,
  sourceFileUrlSchema,
  validateResultSchema,
} from "./asset-import-contract.ts";

import { uploadImportSource } from "./asset-import-source-upload.ts";
import {
  createImportJsonCaller, defaultRequester, unwrapEnvelope,
  type ImportHttpRequester, type ImportHttpResponse,
} from "./asset-import-transport.ts";

// Keep the established imports used by existing check scripts and callers.
export type { ImportHttpRequester, ImportHttpResponse } from "./asset-import-transport.ts";

function parseContentDispositionFilename(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const quoted = /filename="([^"]+)"/i.exec(header)?.[1];
  if (quoted) return quoted;
  const plain = /filename=([^;\s]+)/i.exec(header)?.[1];
  return plain || fallback;
}

export function createHttpImportApi(
  context: AssetImportContext,
  requester: ImportHttpRequester = defaultRequester,
): AssetImportApi {
  const baseHeaders = () => ({
    "x-registration-context": `${context.tenantId}:${context.userId}`,
  });
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

    async addRows(batchId, rows) {
      const data = await callJson(
        "POST",
        `/imports/${encodeURIComponent(batchId.toLowerCase())}/rows`,
        { rows },
      );
      const added = parseImportResponse(addRowsResultSchema, data);
      if (added.received !== rows.length || added.inserted + added.alreadyPresent !== added.received
        || added.batch.rowsStored > added.batch.totalRows) {
        throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE"), 502);
      }
      return { inserted: added.inserted, alreadyPresent: added.alreadyPresent };
    },

    async validate(batchId) {
      const data = await callJson(
        "POST",
        `/imports/${encodeURIComponent(batchId.toLowerCase())}/validate`,
      );
      const validated = parseImportResponse(validateResultSchema, data);
      if (validated.batchId !== batchId.toLowerCase() || validated.status !== "validated"
        || validated.counts.valid + validated.counts.warning + validated.counts.error !== validated.counts.total) {
        throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE"), 502);
      }
      return { status: validated.status, counts: validated.counts };
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

    async listRows(batchId, query) {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.severity) params.set("severity", query.severity);
      if (query.result) params.set("result", query.result);
      if (query.q?.trim()) params.set("q", query.q.trim());
      const data = await callJson(
        "GET",
        `/imports/${encodeURIComponent(batchId.toLowerCase())}/rows?${params.toString()}`,
      );
      const page = parseImportResponse(rowsPageSchema, data);
      if (page.page !== query.page || page.pageSize !== query.pageSize || page.rows.length > page.pageSize) {
        throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE"), 502);
      }
      if (page.page > 1 && (page.page - 1) * page.pageSize >= page.total) {
        throw new ImportApiError("VALIDATION", requestErrorText("VALIDATION", 400), 400);
      }
      return page;
    },

    async confirm(batchId, body) {
      if (!confirmRequestSchema.safeParse(body).success) {
        throw new ImportApiError("VALIDATION", requestErrorText("VALIDATION", 400), 400);
      }
      let data: unknown;
      try {
        data = await callJson("POST", `/imports/${encodeURIComponent(batchId.toLowerCase())}/confirm`, body);
      } catch (error) {
        if (error instanceof ImportApiError && error.status === 404 && error.code !== "NOT_FOUND") {
          throw new ImportApiError("CONFIRM_UNAVAILABLE", requestErrorText("CONFIRM_UNAVAILABLE"), 404);
        }
        throw error;
      }
      const result = parseImportResponse(confirmResultSchema, data);
      const terminal = ["completed", "partially_completed", "failed"].includes(result.status);
      if (result.batchId !== batchId.toLowerCase() || (!terminal && result.status !== "processing")
        || (terminal ? result.remaining !== 0 : result.remaining === 0)) {
        throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE"), 502);
      }
      return result;
    },

    async sourceFileUrl(batchId) {
      const data = await callJson(
        "GET",
        `/imports/${encodeURIComponent(batchId.toLowerCase())}/source-file`,
      );
      const source = parseImportResponse(sourceFileUrlSchema, data);
      return { url: source.url, name: source.name };
    },

    async downloadFile(batchId, kind, batchCode) {
      const safeId = batchId.toLowerCase();
      let response: ImportHttpResponse;
      try {
        response = await requester({
          url: `/api/proxy/v2/asset-workspace/assets/imports/${encodeURIComponent(safeId)}/${kind}-file`,
          method: "GET",
          headers: baseHeaders(),
          responseType: "blob",
        });
      } catch (error) {
        if (error instanceof ImportApiError) throw error;
        throw new ImportApiError("CONNECTION_FAILED", requestErrorText("CONNECTION_FAILED"), 0);
      }

      if (response.status < 200 || response.status >= 300) {
        let parsedBody: unknown = response.data;
        const errorText = response.data instanceof Blob ? await response.data.text()
          : typeof response.data === "string" ? response.data : null;
        if (errorText !== null) {
          try {
            parsedBody = JSON.parse(errorText);
          } catch {
            parsedBody = null;
          }
        }
        unwrapEnvelope({ status: response.status, data: parsedBody });
      }

      if (!(response.data instanceof Blob) && typeof response.data !== "string") {
        throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE"), 502);
      }
      const text = response.data instanceof Blob ? await response.data.text() : response.data;
      // The proxy drops Content-Disposition, so the name usually comes from this fallback.
      const fallback = `${batchCode}-${kind === "error" ? "errors" : "result"}.csv`;
      const filename = parseContentDispositionFilename(
        response.headers?.["content-disposition"],
        fallback,
      );
      return {
        // Decoding the response removes Core's BOM, and Excel needs it to read Thai text.
        blob: new Blob(["\uFEFF", text.replace(/^\uFEFF/, "")], {
          type: "text/csv;charset=utf-8",
        }),
        filename,
      };
    },
  };
}
