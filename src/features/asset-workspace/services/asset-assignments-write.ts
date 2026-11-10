import type { z } from "zod";
import { assetDetailSchema, type AssetDetail } from "./asset-profile-contract.ts";
import { assignmentEventsPageSchema } from "./asset-assignments-contract.ts";
import { assetListSchema } from "./assets-list-types.ts";
import type { requestAssetWorkspace } from "./asset-workspace-api";
import type { ProfileReadResult } from "./asset-profile-api";

export type AssignResult = { ok: true; data: AssetDetail } | { ok: false; code: string; uncertain: boolean };
type Transport = typeof requestAssetWorkspace;
export const ASSIGN_SEARCH_SIZE = 10;
// Loaded lazily so the checks run without the app's HTTP client.
const transportDefault: Transport = async (...args) => (await import("./asset-workspace-api")).requestAssetWorkspace(...args);
const failure = (error: unknown) => error && typeof error === "object" && "code" in error && typeof error.code === "string"
  ? { code: error.code, uncertain: "uncertain" in error && error.uncertain === true } : null;

async function read<T>(path: string, schema: z.ZodType<T>, context: string, signal: AbortSignal, transport: Transport): Promise<ProfileReadResult<T>> {
  try {
    const parsed = schema.safeParse(await transport("GET", path, undefined, { context, signal, timeout: 20000 }));
    return parsed.success ? { ok: true, data: parsed.data } : { ok: false, status: 502, code: "CONTRACT_MISMATCH", message: "" };
  } catch (error) {
    if (signal.aborted) throw error;
    // Screens pick their text from `code` (assignment-error-text.ts), never from a message.
    return { ok: false, status: 0, code: failure(error)?.code ?? "UNREACHABLE", message: "" };
  }
}

/** Select Asset: Available assets only; Core still decides who has a holder (`assignBlock` disables those rows). */
export function searchAvailableAssets(context: string, q: string, signal: AbortSignal, transport: Transport = transportDefault) {
  const query = new URLSearchParams({ status: "Available", pageSize: String(ASSIGN_SEARCH_SIZE) });
  if (q.trim()) query.set("q", q.trim());
  return read(`/list?${query}`, assetListSchema, context, signal, transport);
}

export function getRecentAssignments(context: string, assetId: string, signal: AbortSignal, transport: Transport = transportDefault) {
  return read(`/${encodeURIComponent(assetId)}/assignments?pageSize=3`, assignmentEventsPageSchema, context, signal, transport);
}

/** Never retried here: an uncertain result means the action may already have happened. */
async function postCustody(action: "assign" | "transfer" | "return", context: string, assetId: string, body: unknown, signal: AbortSignal,
  transport: Transport): Promise<AssignResult> {
  try {
    const data = await transport("POST", `/${encodeURIComponent(assetId)}/${action}`, body, { context, signal, creation: true });
    const parsed = assetDetailSchema.safeParse(data);
    return parsed.success && parsed.data.id === assetId ? { ok: true, data: parsed.data } : { ok: false, code: "INVALID_RESPONSE", uncertain: true };
  } catch (error) {
    const known = failure(error);
    if (known) return { ok: false, ...known };
    return { ok: false, code: signal.aborted ? "CANCELLED" : "CONNECTION_FAILED", uncertain: !signal.aborted };
  }
}

export const assignAsset = (context: string, assetId: string, body: unknown, signal: AbortSignal, transport: Transport = transportDefault) =>
  postCustody("assign", context, assetId, body, signal, transport);

export const transferAsset = (context: string, assetId: string, body: unknown, signal: AbortSignal, transport: Transport = transportDefault) =>
  postCustody("transfer", context, assetId, body, signal, transport);

export const returnAsset = (context: string, assetId: string, body: unknown, signal: AbortSignal, transport: Transport = transportDefault) =>
  postCustody("return", context, assetId, body, signal, transport);
