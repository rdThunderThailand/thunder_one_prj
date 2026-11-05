import type { RefObject } from "react";
import type { ColumnMapping, ImportBatch, ImportConfirmBody, ImportOptions, ParsedImportFile } from "../domain/asset-import-types.ts";
import { requestErrorText } from "../domain/asset-import-messages.ts";
import { ImportApiError, type AssetImportApi } from "../services/asset-import-api.ts";
import { ParseError } from "../services/asset-import-parse.ts";
import type { ImportAttempt, ImportProgress } from "../services/asset-import-start.ts";
import type { ImportValidationAttempt } from "../services/asset-import-validation.ts";

type PendingBatch = ImportAttempt;

export type Lifecycle = {
  context: string;
  controller: AbortController;
  active: boolean;
  pending: PendingBatch | null;
  validation: ImportValidationAttempt | null;
};

export type FlowState = {
  context: string;
  batch: ImportBatch | null;
  parsed: ParsedImportFile | null;
  selectedFile: File | null;
  mapping: ColumnMapping;
  parsing: boolean;
  busy: boolean;
  restoring: boolean;
  restoringFile: boolean;
  restoreFailed: boolean;
  loadedRoute: string;
  progress: ImportProgress | null;
  error: ImportApiError | ParseError | null;
  notice: string | null;
  retrying: boolean;
  rowsSent: boolean;
  mappingView: boolean;
  confirming: boolean;
  confirmation: ImportConfirmBody | null;
  previewStep: 0 | 1;
};

// Parsed bytes and retry intent remain memory-only and scoped to the authenticated context.
export const importFlowMemory: {
  context: string;
  batchId: string | null;
  pending: PendingBatch | null;
  validation: ImportValidationAttempt | null;
  confirmation: { batchId: string; body: ImportConfirmBody } | null;
} = { context: "", batchId: null, pending: null, validation: null, confirmation: null };

/** Callbacks shared by focused flow hooks; this does not own another copy of state. */
export type ImportFlowRuntime = {
  api: AssetImportApi;
  options: ImportOptions | null;
  userId: string;
  context: string;
  preview: boolean;
  batchId: string | null;
  routeKey: string;
  version: number;
  current: RefObject<FlowState>;
  lifecycleRef: RefObject<Lifecycle | null>;
  publish: (lifecycle: Lifecycle, changes: Partial<FlowState>) => void;
  updateUrl: (id: string | null) => void;
  run: (work: (lifecycle: Lifecycle) => Promise<void>, uploading?: boolean) => Promise<boolean>;
  clearLocal: (lifecycle: Lifecycle, notice?: string | null) => void;
  discard: (lifecycle: Lifecycle) => Promise<void>;
};

export function emptyState(context: string): FlowState {
  return {
    context,
    batch: null,
    parsed: null,
    selectedFile: null,
    mapping: [],
    parsing: false,
    busy: false,
    restoring: false,
    restoringFile: false,
    restoreFailed: false,
    loadedRoute: "",
    progress: null,
    error: null,
    notice: null,
    retrying: false,
    rowsSent: false,
    mappingView: false,
    confirming: false,
    confirmation: null,
    previewStep: 0,
  };
}

export function assertActive(lifecycle: Lifecycle) {
  lifecycle.controller.signal.throwIfAborted();
}

export function safeError(error: unknown): ImportApiError | ParseError {
  if (error instanceof ParseError) return error;
  if (error instanceof ImportApiError) {
    if (error.code === "CELL_TOO_LONG") return error;
    return new ImportApiError(
      error.code,
      requestErrorText(error.code, error.status),
      error.status,
      error.details,
    );
  }
  return new ImportApiError("INTERNAL", requestErrorText("INTERNAL"));
}

