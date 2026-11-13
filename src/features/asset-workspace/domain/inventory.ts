// Inventory Sessions (PO 05 §4.5, §4.9 · 03 §2.5.1 · checklist E:\ThunderOne\docs\inventory\asset-ws-inventory-checklist.md).
// Pure rules for the list, the Start Inventory wizard and the session header. Core enforces every rule again.
import { ASSET_CONDITIONS } from "./asset-condition.ts";
import type { SessionStatus } from "./report.ts";

export type ScopeMode = "by_scope" | "specific_assets";
export type CustodianType = "person" | "org_unit";

export interface Named {
  id: string;
  name: string;
}

export type Person = Named;

export interface SessionDetail {
  id: string;
  name: string;
  description: string | null;
  status: SessionStatus;
  dueDate: string | null;
  owner: Person | null;
  createdBy: Person | null;
  scopeMode: ScopeMode;
  scope: {
    locations: Named[];
    orgUnits: Named[];
    categories: Named[];
    custodians: (Named & { type: CustodianType })[];
    assetIds: string[];
  };
  scopeLabel: string;
  counts: { expected: number; verified: number; mismatch: number; notFound: number; unexpected: number; remaining: number };
  startedAt: string | null;
  completedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What the wizard sends as `scope` (Core `PATCH inventory-sessions/{id}`, `scope-preview`). */
export interface ScopeInput {
  locationIds: string[];
  orgUnitIds: string[];
  categoryIds: string[];
  custodians: { type: CustodianType; id: string }[];
  assetIds: string[];
}

export const EMPTY_SCOPE: ScopeInput = { locationIds: [], orgUnitIds: [], categoryIds: [], custodians: [], assetIds: [] };

export function toScopeInput(scope: SessionDetail["scope"]): ScopeInput {
  return {
    locationIds: scope.locations.map((l) => l.id),
    orgUnitIds: scope.orgUnits.map((u) => u.id),
    categoryIds: scope.categories.map((c) => c.id),
    custodians: scope.custodians.map(({ type, id }) => ({ type, id })),
    assetIds: scope.assetIds,
  };
}

/** By Scope needs at least one Location (PO sticky Step 2); Specific Assets needs at least one asset. */
export function scopeReady(mode: ScopeMode, scope: ScopeInput) {
  return mode === "by_scope" ? scope.locationIds.length > 0 : scope.assetIds.length > 0;
}

/** Only the mode's own keys go to Core: switching mode must not carry hidden selections into the snapshot. */
export function scopeForMode(mode: ScopeMode, scope: ScopeInput): ScopeInput {
  return mode === "by_scope" ? { ...scope, assetIds: [] } : { ...EMPTY_SCOPE, assetIds: scope.assetIds };
}

// ── Step 1 Session Setup ──

export const NAME_MAX = 100;
export const DESCRIPTION_MAX = 500;

export interface SetupDraft {
  name: string;
  description: string;
  dueDate: string;
  ownerUserId: string;
}

export interface SetupInput {
  name: string;
  description: string | null;
  dueDate: string;
  ownerUserId?: string;
}

export function validateSetup(draft: SetupDraft): { ok: true; input: SetupInput } | { ok: false; fields: Partial<Record<keyof SetupDraft, string>> } {
  const name = draft.name.trim();
  const description = draft.description.trim();
  const fields: Partial<Record<keyof SetupDraft, string>> = {};
  if (!name) fields.name = "Enter a session name.";
  else if (name.length > NAME_MAX) fields.name = `Use ${NAME_MAX} characters or fewer.`;
  if (description.length > DESCRIPTION_MAX) fields.description = `Use ${DESCRIPTION_MAX} characters or fewer.`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.dueDate)) fields.dueDate = "Choose a due date.";
  if (Object.keys(fields).length) return { ok: false, fields };
  return {
    ok: true,
    input: { name, description: description || null, dueDate: draft.dueDate, ...(draft.ownerUserId ? { ownerUserId: draft.ownerUserId } : {}) },
  };
}

/** Whole days from `today` to `dueDate` (both `YYYY-MM-DD`) as the wizard / header hint. */
export function dueHint(dueDate: string | null, today: string): { text: string; overdue: boolean } | null {
  if (!dueDate) return null;
  const days = Math.round((Date.parse(dueDate) - Date.parse(today)) / 86_400_000);
  if (days < 0) return { text: `${-days} ${-days === 1 ? "day" : "days"} overdue`, overdue: true };
  if (days === 0) return { text: "Due today", overdue: false };
  return { text: `${days} ${days === 1 ? "day" : "days"} left`, overdue: false };
}

/** Today in Asia/Bangkok as `YYYY-MM-DD` (Core counts Due Soon the same way). */
export const bangkokToday = (now = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(now);

// ── Session list ──

const BASE = "/asset-workspace/inventory";

/** A Draft opens the wizard (it has no detail page); every other status opens the detail. */
export const sessionHref = (row: { id: string; status: SessionStatus }) =>
  row.status === "Draft" ? `${BASE}/${row.id}/setup` : `${BASE}/${row.id}`;

/** Date-range filter `YYYY-MM-DD` → Core's `[from, to)` ISO instants in Asia/Bangkok (`to` is inclusive on screen). */
export function startedRange(from?: string, to?: string) {
  const day = /^\d{4}-\d{2}-\d{2}$/;
  const next = (d: string) => new Date(Date.parse(`${d}T00:00:00+07:00`) + 86_400_000).toISOString();
  return {
    ...(from && day.test(from) ? { from: `${from}T00:00:00+07:00` } : {}),
    ...(to && day.test(to) ? { to: next(to) } : {}),
  };
}

/** Wizard step from the URL: 1–3; a Draft with no step resumes where its data ends. */
export function wizardStep(raw: string | undefined, detail: Pick<SessionDetail, "scopeMode" | "scope"> | null): 1 | 2 | 3 {
  if (raw === "1" || raw === "2" || raw === "3") return Number(raw) as 1 | 2 | 3;
  if (!detail) return 1;
  return scopeReady(detail.scopeMode, toScopeInput(detail.scope)) ? 3 : 2;
}

// ── Step 3 Review & Start · Session detail (slice I2) ──

/** Why someone verifies a group (Core `inventory_session_assignments`). */
export const REASON_LABEL: Record<string, string> = {
  custodian: "Custodian",
  org_unit_manager: "OU manager",
  owner: "Session owner",
  reassigned: "Reassigned",
};

export interface AssignmentGroup {
  assignee: Person & { type: "person" };
  reasons: string[];
  expectedAssets: number;
  done: number;
  progressPct: number;
  locations: Named[];
  scopeLabel: string;
  /** `null` before Start; `pending` after it: nothing is sent yet (D13). */
  notificationStatus: "pending" | "sent" | "failed" | null;
}

export interface Assignments {
  data: AssignmentGroup[];
  updatedAt: string;
}

export const SESSION_ASSET_RESULTS = ["Verified", "Mismatch", "Not Found", "Remaining"] as const;
export type SessionAssetResult = (typeof SESSION_ASSET_RESULTS)[number];

export interface SessionAsset {
  snapshotId: string;
  assetId: string;
  assetTag: string;
  name: string;
  serialNumber: string | null;
  category: { id: string; name: string | null } | null;
  expectedLocation: { id: string; name: string | null } | null;
  expectedCustodian: (Named & { type: CustodianType }) | null;
  /** `null` = no result yet (Remaining). */
  result: Exclude<SessionAssetResult, "Remaining"> | null;
  resultId: string | null;
  resultUpdatedAt: string | null;
  verifiedBy: Person | null;
  verifiedAt: string | null;
  assignee: Person | null;
}

export interface Breakdown {
  id: string;
  name: string;
  expected: number;
  done: number;
}

export interface SessionAssets {
  data: SessionAsset[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  /** Every row the caller may see, before the filters. */
  byLocation: Breakdown[];
  byCategory: Breakdown[];
}

/** Overview numbers from the detail `counts`. Discrepancies = Mismatch + Not Found + Unexpected. */
export function sessionProgress(counts: SessionDetail["counts"]) {
  const done = counts.expected - counts.remaining;
  return {
    done,
    pct: counts.expected ? Math.round((done / counts.expected) * 100) : 0,
    discrepancies: counts.mismatch + counts.notFound + counts.unexpected,
  };
}

/** Header actions (§1.1): a Draft lives in the wizard; Close / Reconcile come in I4. Verify and Report Unexpected
 *  follow `continue` (In Progress only). */
export function sessionActions(status: SessionStatus) {
  const inProgress = status === "In Progress";
  return { continue: inProgress, cancel: status === "Draft" || inProgress, complete: inProgress };
}

// ── Verify · Report Unexpected · Discrepancies (slice I3) ──

export const CONDITIONS = ASSET_CONDITIONS;
export type Condition = (typeof ASSET_CONDITIONS)[number];
export type VerifyResult = Exclude<SessionAssetResult, "Remaining">;
export const VERIFY_RESULTS: readonly VerifyResult[] = ["Verified", "Mismatch", "Not Found"];
export const NOTE_MAX = 1000;
export const IDENTIFIER_MAX = 100;

export interface VerifyDraft {
  result: VerifyResult;
  /** `""` = as expected. */
  locationId: string;
  /** `""` = as expected, else `person:<id>` / `org_unit:<id>`. */
  custody: string;
  /** `""` = not checked (stored as expected). */
  condition: Condition | "";
  note: string;
}

export interface VerifyInput {
  snapshotId: string;
  result: VerifyResult;
  actualLocationId?: string;
  actualCustodyType?: CustodianType;
  actualCustodyId?: string;
  condition?: Condition;
  note?: string;
  expectedUpdatedAt?: string;
}

/** Verify dialog → Core `verifications` body. Only Mismatch carries actual values, and needs at least one of them;
 *  a changed result sends its `resultUpdatedAt` (STALE guard). Core checks again that the values really differ. */
export function verifyInput(
  row: Pick<SessionAsset, "snapshotId" | "resultUpdatedAt">,
  draft: VerifyDraft,
): { ok: true; input: VerifyInput } | { ok: false; field: "actual" | "note"; message: string } {
  const note = draft.note.trim();
  if (note.length > NOTE_MAX) return { ok: false, field: "note", message: `Use ${NOTE_MAX} characters or fewer.` };
  const input: VerifyInput = {
    snapshotId: row.snapshotId,
    result: draft.result,
    ...(note ? { note } : {}),
    ...(row.resultUpdatedAt ? { expectedUpdatedAt: row.resultUpdatedAt } : {}),
  };
  if (draft.result !== "Mismatch") return { ok: true, input };
  const [type, id] = draft.custody.split(":");
  if (!draft.locationId && !id && !draft.condition) {
    return { ok: false, field: "actual", message: "Choose what is different: location, custodian or condition." };
  }
  return {
    ok: true,
    input: {
      ...input,
      ...(draft.locationId ? { actualLocationId: draft.locationId } : {}),
      ...(id ? { actualCustodyType: type as CustodianType, actualCustodyId: id } : {}),
      ...(draft.condition ? { condition: draft.condition } : {}),
    },
  };
}

/** Scanner / typed search: the one row whose tag, serial (or barcode, matched by Core) equals the code opens Verify. */
export function scanMatch<T extends Pick<SessionAsset, "assetTag" | "serialNumber">>(rows: T[], code: string | undefined) {
  const c = code?.trim().toLowerCase();
  if (!c) return null;
  const hits = rows.filter((r) => r.assetTag.toLowerCase() === c || r.serialNumber?.toLowerCase() === c);
  return hits.length === 1 ? hits[0] : null;
}

export const FINDING_TYPES = ["not_found", "unexpected", "mismatch_location", "mismatch_custody", "mismatch_condition"] as const;
export type FindingType = (typeof FINDING_TYPES)[number];

/** PO words (05 §4.9): never "Missing" / "Other Issues". */
export const FINDING_LABEL: Record<FindingType, string> = {
  not_found: "Not Found",
  unexpected: "Unexpected",
  mismatch_location: "Mismatch · Location",
  mismatch_custody: "Mismatch · Custody",
  mismatch_condition: "Mismatch · Condition",
};

/** Badge tone key (`INVENTORY_RESULT_TONE`). */
export const findingResult = (type: FindingType) =>
  type === "not_found" ? "Not Found" : type === "unexpected" ? "Unexpected" : "Mismatch";

/** Result filter on the Discrepancies tab: `mismatch` = every subtype (Core). */
export const FINDING_FILTERS = [
  { value: "not_found", label: "Not Found" },
  { value: "unexpected", label: "Unexpected" },
  { value: "mismatch", label: "Mismatch (all)" },
  { value: "mismatch_location", label: "Mismatch · Location" },
  { value: "mismatch_custody", label: "Mismatch · Custody" },
  { value: "mismatch_condition", label: "Mismatch · Condition" },
];

type Ref = { id: string; name: string | null } | null;

export interface Finding {
  id: string;
  type: FindingType;
  verificationId: string | null;
  assetId: string | null;
  unexpectedIdentifier: string | null;
  asset: { id: string; name: string; assetTag: string; serialNumber: string | null } | null;
  category: Ref;
  expectedLocation: Ref;
  foundLocation: Ref;
  expectedCustodian: (Named & { type: CustodianType }) | null;
  foundCustodian: (Named & { type: CustodianType }) | null;
  expectedCondition: string | null;
  foundCondition: string | null;
  reportedBy: Person | null;
  reportedAt: string;
  note: string | null;
  resolutionState: "open" | "dismissed" | "reconciled";
}

export interface Findings {
  data: Finding[];
  /** Every finding the caller may see, before the filters. */
  counts: { total: number; open: number; notFound: number; unexpected: number; mismatch: { location: number; custody: number; condition: number } };
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** "Expected → Found" for a Mismatch row's subtype; `null` for the other types. */
export function findingChange(f: Finding): string | null {
  const pair = (a: string | null | undefined, b: string | null | undefined) => `${a || "—"} → ${b || "—"}`;
  if (f.type === "mismatch_custody") return pair(f.expectedCustodian?.name, f.foundCustodian?.name);
  if (f.type === "mismatch_condition") return pair(f.expectedCondition, f.foundCondition);
  if (f.type === "mismatch_location") return pair(f.expectedLocation?.name, f.foundLocation?.name);
  return null;
}

export const DETAIL_TABS = [
  { key: "overview", label: "Overview" },
  { key: "assets", label: "Assets" },
  { key: "discrepancies", label: "Discrepancies" },
  { key: "activity", label: "Activity" },
] as const;

export const detailHref = (id: string, tab: (typeof DETAIL_TABS)[number]["key"] = "overview") =>
  `${BASE}/${encodeURIComponent(id)}/${tab}`;
