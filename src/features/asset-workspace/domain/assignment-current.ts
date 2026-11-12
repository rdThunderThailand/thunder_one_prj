import { z } from "zod";
import type { CurrentAssignment } from "../services/asset-assignments-contract.ts";
import { returnBlock, transferBlock } from "./custody.ts";
import { ASSET_CONDITIONS } from "./asset-condition.ts";
import { ASSET_STATUSES } from "./asset-status.ts";

export const CURRENT_FILTER_KEYS = ["q", "category_id", "location_id", "custody_type", "custody_id"] as const;
const keys = [...CURRENT_FILTER_KEYS, "page", "pageSize", "tab"];
const querySchema = z.object({
  q: z.string().trim().max(200).optional(), category_id: z.guid().optional(), location_id: z.guid().optional(),
  custody_type: z.enum(["person", "org_unit"]).optional(), custody_id: z.guid().optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(200).default(25),
  tab: z.enum(["current", "history"]).default("current"),
}).refine((query) => !query.custody_id || Boolean(query.custody_type));
export type CurrentAssignmentQuery = Omit<z.infer<typeof querySchema>, "tab">;
export type AssignmentSearchParams = Record<string, string | string[] | undefined>;

export function readCurrentAssignmentQuery(input: AssignmentSearchParams) {
  if (keys.some((key) => Array.isArray(input[key]))) return { ok: false as const };
  const allowed = Object.fromEntries(keys.flatMap((key) => {
    const value = input[key];
    return typeof value === "string" && value !== "" ? [[key, value]] : [];
  }));
  const parsed = querySchema.safeParse(allowed);
  if (!parsed.success) return { ok: false as const };
  const { tab, ...query } = parsed.data;
  return { ok: true as const, tab, query, filtered: CURRENT_FILTER_KEYS.some((key) => Boolean(query[key])) };
}

export function currentAssignmentQueryString(query: CurrentAssignmentQuery) {
  const params = new URLSearchParams();
  for (const key of [...CURRENT_FILTER_KEYS, "page", "pageSize"] as const) {
    const value = query[key];
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export function assignmentActions(row: CurrentAssignment) {
  const status = ASSET_STATUSES.find((value) => value === row.asset.lifecycleStatus);
  const condition = ASSET_CONDITIONS.find((value) => value === row.asset.condition);
  if (!status) return { transfer: "Transfer is available only for Assigned assets.", return: "Return is available only for Assigned assets." };
  const state = { status, condition: condition ?? "Good", custody: { ...row.custodian, label: row.custodian.name ?? "Unnamed custodian" } };
  const returnReason = returnBlock(state) ? "Return is available only for Assigned assets." : null;
  const block = transferBlock(state);
  const transferReason = block === "not_assigned" ? "Transfer is available only for Assigned assets."
    : block === "condition_blocks_transfer" ? "Return it instead"
      : !condition ? "The asset condition could not be verified. View the asset before transferring." : null;
  return { transfer: transferReason, return: returnReason };
}

export function assignmentDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok",
  }).format(date) : "Not available";
}
