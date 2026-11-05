import { z } from "zod";
import { IMPORT_FIELD_KEYS, type ParsedImportFile } from "../domain/asset-import-types.ts";

const sessionSchema = z.object({
  mapping: z.array(z.enum(IMPORT_FIELD_KEYS).nullable()),
  uploadId: z.uuid(),
  rowsSent: z.boolean().optional(),
  mappingView: z.boolean().optional(),
  mode: z.enum(["ready_and_warnings", "ready_only"]).optional(),
  confirmation: z.object({
    mode: z.enum(["ready_and_warnings", "ready_only"]).optional(),
    override_reason: z.string().trim().min(1).max(1000).optional(),
  }).strict().optional(),
});

export type ImportSession = z.infer<typeof sessionSchema>;

// File bytes and parsed cells are deliberately never written to browser storage.
let parsedFile: ParsedImportFile | null = null;
let pendingNotice: { context: string; message: string } | null = null;

export function setImportNotice(context: string, message: string): void {
  pendingNotice = { context, message };
}

export function takeImportNotice(context: string): string | null {
  const notice = pendingNotice;
  pendingNotice = null;
  return notice?.context === context ? notice.message : null;
}

export function getParsedImportFile(): ParsedImportFile | null {
  return parsedFile;
}

export function setParsedImportFile(file: ParsedImportFile | null): void {
  parsedFile = file;
}

export function importSessionKey(batchId: string): string {
  return `asset-import:${batchId}`;
}

export function readImportSession(batchId: string): {
  state: ImportSession | null;
  unavailable: boolean;
} {
  try {
    const raw = sessionStorage.getItem(importSessionKey(batchId));
    if (!raw) return { state: null, unavailable: false };

    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      sessionStorage.removeItem(importSessionKey(batchId));
      return { state: null, unavailable: false };
    }

    const result = sessionSchema.safeParse(value);
    if (result.success) return { state: result.data, unavailable: false };
    sessionStorage.removeItem(importSessionKey(batchId));
    return { state: null, unavailable: false };
  } catch {
    return { state: null, unavailable: true };
  }
}

export function saveImportSession(batchId: string, state: ImportSession): boolean {
  try {
    const result = sessionSchema.safeParse(state);
    if (!result.success) return false;
    sessionStorage.setItem(importSessionKey(batchId), JSON.stringify(result.data));
    return true;
  } catch {
    return false;
  }
}

export function removeImportSession(batchId: string): boolean {
  try {
    sessionStorage.removeItem(importSessionKey(batchId));
    return true;
  } catch {
    return false;
  }
}
