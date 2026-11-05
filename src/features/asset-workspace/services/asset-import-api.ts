import type { z } from "zod";
import type { ImportBatch, ImportOptions } from "../domain/asset-import-types.ts";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import { createHttpImportApi } from "./asset-import-http.ts";

export type AssetImportContext = {
  tenantId: string;
  userId: string;
};

export class ImportApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status = 0, details?: unknown) {
    super(message);
    this.name = "ImportApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface AssetImportApi {
  getOptions(): Promise<ImportOptions>;
  uploadSource(input: {
    batchId: string;
    uploadId: string;
    file: File;
    mimeType: string;
    onProgress?: (pct: number) => void;
    checkActive?: () => void;
  }): Promise<{ fileId: string }>;
  createBatch(input: {
    batchId: string;
    sourceUploadId: string;
    totalRows: number;
    originalImportId?: string;
  }): Promise<{ batchId: string; batchCode: string; replayed: boolean }>;
  discard(batchId: string): Promise<void>;
  getBatch(batchId: string): Promise<ImportBatch>;
}

export function parseImportResponse<T>(schema: z.ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ImportApiError("INVALID_RESPONSE", requestErrorText("INVALID_RESPONSE", 502), 502);
  }
  return parsed.data;
}

export function getAssetImportApi(context: AssetImportContext): AssetImportApi {
  return createHttpImportApi(context);
}
