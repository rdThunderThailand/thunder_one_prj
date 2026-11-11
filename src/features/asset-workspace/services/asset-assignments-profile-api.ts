import { z } from "zod";
import { assignmentHistoryEventSchema, assignmentHistoryPageSchema } from "./asset-assignments-contract.ts";
import { assignmentHistoryQueryString, type AssignmentHistoryQuery } from "../domain/assignment-history.ts";
import type { requestAssetWorkspace } from "./asset-workspace-api";
import type { ProfileReadResult } from "./asset-profile-api";

const period = z.object({
  startedAt: z.iso.datetime({ offset: true }),
  endedAt: z.iso.datetime({ offset: true }).nullable(),
}).refine(({ startedAt, endedAt }) => endedAt === null || Date.parse(endedAt) >= Date.parse(startedAt));
const eventSchema = assignmentHistoryEventSchema.safeExtend({ custodyPeriod: period.nullable() })
  .refine((event) => event.action === "Return" ? event.custodyPeriod === null : event.custodyPeriod !== null);
const pageSchema = assignmentHistoryPageSchema.safeExtend({ data: z.array(eventSchema) });
export type ProfileAssignmentEvent = z.infer<typeof eventSchema>;
export type ProfileAssignmentPage = z.infer<typeof pageSchema>;

type Transport = typeof requestAssetWorkspace;
const transportDefault: Transport = async (...args) => (await import("./asset-workspace-api")).requestAssetWorkspace(...args);

export async function getProfileAssignments(context: string, assetId: string, query: AssignmentHistoryQuery,
  signal: AbortSignal, transport: Transport = transportDefault): Promise<ProfileReadResult<ProfileAssignmentPage>> {
  const path = `/${encodeURIComponent(assetId)}/assignments?${assignmentHistoryQueryString(query)}`;
  try {
    const result = pageSchema.safeParse(await transport("GET", path, undefined, { context, signal, timeout: 20000 }));
    if (!result.success || result.data.page !== query.page || result.data.pageSize !== query.pageSize
      || result.data.data.some((row) => row.asset.id.toLowerCase() !== assetId.toLowerCase())) {
      return { ok: false, status: 502, code: "CONTRACT_MISMATCH", message: "" };
    }
    return { ok: true, data: result.data };
  } catch (error) {
    if (signal.aborted) throw error;
    const code = error && typeof error === "object" && "code" in error && typeof error.code === "string"
      ? error.code : "UNREACHABLE";
    return { ok: false, status: 0, code, message: "" };
  }
}
