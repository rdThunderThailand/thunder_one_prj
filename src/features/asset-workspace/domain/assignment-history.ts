import { z } from "zod";
import type { AssignmentHistoryEvent } from "../services/asset-assignments-contract.ts";
import type { AssignmentSearchParams } from "./assignment-current.ts";

export const HISTORY_FILTER_KEYS = ["q", "event_type", "date_from", "date_to"] as const;
const queryKeys = [...HISTORY_FILTER_KEYS, "page", "pageSize", "tab"] as const;
const querySchema = z.object({
  q: z.string().trim().max(200).optional(),
  event_type: z.enum(["Assign", "Transfer", "Return"]).optional(),
  date_from: z.iso.date().optional(), date_to: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20),
  tab: z.literal("history").default("history"),
}).refine((query) => !query.date_from || !query.date_to || query.date_from <= query.date_to);
export type AssignmentHistoryQuery = Omit<z.infer<typeof querySchema>, "tab">;

export function readAssignmentHistoryQuery(input: AssignmentSearchParams) {
  if (queryKeys.some((key) => Array.isArray(input[key]))) return { ok: false as const };
  const allowed = Object.fromEntries(queryKeys.flatMap((key) => {
    const value = input[key];
    return typeof value === "string" && value !== "" ? [[key, value]] : [];
  }));
  const parsed = querySchema.safeParse(allowed);
  if (!parsed.success) return { ok: false as const };
  const { tab, ...query } = parsed.data;
  return { ok: true as const, tab, query, filtered: HISTORY_FILTER_KEYS.some((key) => Boolean(query[key])) };
}

export function assignmentHistoryQueryString(query: AssignmentHistoryQuery) {
  const params = new URLSearchParams();
  for (const key of [...HISTORY_FILTER_KEYS, "page", "pageSize"] as const) {
    const value = query[key];
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return params.toString();
}

export const ASSIGNMENT_EVENT_LABEL = { Assign: "Assignment", Transfer: "Transfer", Return: "Return" } as const;
export const ASSIGNMENT_EVENT_TONE = { Assign: "blue", Transfer: "indigo", Return: "red" } as const;
export const HISTORY_COLUMNS = ["#", "Asset", "Event Type", "From", "To / Custodian", "Date & Time",
  "Location", "Condition at Return", "Performed By", "Notes / Reason"] as const;
export const assignmentEventKey = (event: Pick<AssignmentHistoryEvent, "action" | "id">) => `${event.action}:${event.id}`;
export const assignmentHistoryReason = (reason: string | null) => reason === "backfill" ? "—" : reason || "—";
export const assignmentHistoryRowNumber = (page: number, pageSize: number, index: number) => (page - 1) * pageSize + index + 1;

export function assignmentHistoryDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return { date: "—", time: "—" };
  return {
    date: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }).format(date),
    time: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Bangkok" }).format(date),
  };
}

export function assignmentEvidenceState(url: string | null, expiresAt: string, now: number) {
  if (now >= Date.parse(expiresAt)) return "expired";
  return url ? "available" : "unavailable";
}
