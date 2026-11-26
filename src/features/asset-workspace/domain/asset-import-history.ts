import { z } from "zod";
import { AssetActionError, readActionFailure } from "./asset-action-error.ts";
import type { StatusTone } from "./status-tone.ts";

export const HISTORY_PAGE_SIZE = 25;
export const historyStatusSchema = z.enum(["completed", "partially_completed", "failed"]);
export type HistoryStatus = z.infer<typeof historyStatusSchema>;
export const HISTORY_STATUS: Record<HistoryStatus, { label: string; tone: StatusTone }> = {
  completed: { label: "Completed", tone: "green" },
  partially_completed: { label: "Partially completed", tone: "yellow" },
  failed: { label: "Failed", tone: "red" },
};
export const importHistorySchema = z.object({
  batches: z.array(z.object({
    id: z.guid(), batchCode: z.string(), fileName: z.string().nullable(),
    createdAt: z.iso.datetime({ offset: true }), status: historyStatusSchema,
    counts: z.object({ total: z.number().int().nonnegative(), created: z.number().int().nonnegative(), failed: z.number().int().nonnegative() }),
  })).max(HISTORY_PAGE_SIZE),
  page: z.number().int().positive(), pageSize: z.literal(HISTORY_PAGE_SIZE), total: z.number().int().nonnegative(),
});
export type ImportHistory = z.infer<typeof importHistorySchema>;

export function importHistoryFailure(error: unknown) {
  if (error instanceof AssetActionError) return error;
  const { status, code } = readActionFailure(error);
  const message = status === 401 ? "Your session has expired. Sign in again to view Import History."
    : status === 403 ? "You do not have permission to view Import History in this organization."
      : status === 404 || status === 503 ? "Import History is not available on this server yet."
        : "Import History could not be loaded. Try again.";
  return new AssetActionError(message, status, code);
}
