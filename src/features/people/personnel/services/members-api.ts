// Real Thunder_Core integration for the Personnel roster (/people/personnel)
// — server-only, same "reads the session cookie's bearer token via
// get-session.ts's getAuthToken(), passed in explicitly" shape as
// asset-intelligence/assets/services/asset-list-api.ts.
//
// Contract confirmed directly with Core 2026-08-28 (docs/people/
// core-response-people-workspace-api.md, "GET/POST /tenants/:id/members").
// Two things that differ from asset-list-api.ts's envelope, worth
// remembering here: the envelope is `{ data: { data: [...], count } }`, not
// `{ data, page, pageSize, total, totalPages }` — the outer `data` is this
// endpoint's own container, not a page of rows directly. And pagination is
// `page`/`limit` (default 8, max 100), not `pageSize`.
//
// `member_type` (resolved 2026-08-28, wired into createMember/createEmployee
// below) is now the real Employee/Contractor/Partner/Guest distinction —
// ../core-mapper.ts's `"employee"` default only still matters for rows Core
// returns with `member_type: null` (created before this field existed).
//
// `createMember`/`createEmployee`/`updateMemberContract` (the write side) are
// client-safe — unlike `getMembers` below, they go through requestApi/the
// `/api/proxy` route rather than fetching Core directly, so they can be
// called from a "use client" component (the add-person wizards) the same way
// asset-intelligence/assets/services/assets-api.ts's createAsset does.
//
// `coreGet` มาจาก lib/core/core-get.ts (ของกลางที่แยกออกมาให้ people/org-
// structure's organizations-api.ts และ people/personnel's roles-api.ts ใช้
// ร่วมกัน แทนที่จะก็อปปี้ไว้คนละไฟล์เหมือนเดิม — ครอบด้วย React.cache() แล้ว
// ด้วย จึงกัน request ซ้ำ path+token เดิมภายในหนึ่ง request ให้อัตโนมัติ).
import { requestApi } from "@/lib/api/media-api";
import { coreGet } from "@/lib/core/core-get";

export interface CoreMemberRow {
  id: string;
  user_id: string;
  tenant_id: string;
  status: "invited" | "active" | "suspended" | "removed" | "archived";
  joined_at: string;
  employee_code: string | null;
  job_title: string | null;
  default_department_id: string | null;
  start_date: string | null;
  role_code: string | null;
  role_type: string | null;
  user: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
}

/**
 * `POST /tenants/:id/members`'s response when `email` had no existing
 * account — Core creates an invitation instead of a membership. No `id`
 * field at all (deliberately — there's no membership yet), which is what
 * `isPendingInvite` below discriminates on.
 */
export interface CoreInviteResult {
  invitation_id: string;
  email: string;
  status: "invited";
  role_code: string;
  role_type: string | null;
  expires_at: string;
  invite_url: string;
}

export function isPendingInvite(result: CoreMemberRow | CoreInviteResult): result is CoreInviteResult {
  return "invitation_id" in result;
}

export interface CreateMemberInput {
  email: string;
  /** Required by Core — see ./roles-api.ts's getRoles() for how a caller
   *  gets valid values for a given tenant. */
  role_code: string;
  employee_code?: string;
  job_title?: string;
  default_department_id?: string;
  /** "YYYY-MM-DD". */
  start_date?: string;
  /** Resolved 2026-08-28 (docs/api/people-workspace-response.md §8 Q1) —
   *  live on `addMemberSchema` since then. Omitting it leaves the row
   *  indistinguishable from an employee's; every wizard that knows which
   *  kind of person it's creating should send it. */
  member_type?: "employee" | "contractor" | "partner" | "guest";
  /** Added to `addMemberSchema` in the 2026-09-01 employment-fields migration
   *  (20260901090100_people_add_employee_employment_fields.sql) — real
   *  columns on `memberships`, independent of `POST /tenants/:id/employees`
   *  below (see docs/api/add-employee-integration-guide.md). */
  job_type?: "full_time" | "part_time";
  work_arrangement?: "on_site" | "hybrid" | "remote";
  /** "YYYY-MM-DD". */
  probation_end_date?: string;
  /** ≤2000 chars. One column on `memberships` — Core's design guideline
   *  merged the wizards' separate Step 1/Step 2 "หมายเหตุ" boxes into this
   *  single field; callers with two local note fields should join them
   *  before sending, not pick one and drop the other. */
  notes?: string;
}

/** `membership_contract` fields (docs/api/contractor-bulk-triage-response.md,
 *  built 2026-09-04) — its own table/route, deliberately excluded from
 *  `MEMBER_SELECT`/`CoreMemberRow` since it's contract/procurement data, not
 *  roster data. Only meaningful for a real membership (`CoreMemberRow.id`),
 *  not a pending `CoreInviteResult` — there's no membership row yet to hang
 *  a contract off of until the invite is accepted. */
export interface MemberContract {
  contract_number: string | null;
  contract_date: string | null;
  contract_value: number | null;
  payment_format: "monthly" | "installment" | "on_completion" | null;
  payment_cycle: "end_of_month" | "every_15_days" | null;
}

export type UpdateMemberContractInput = Partial<Omit<MemberContract, "contract_value">> & {
  contract_value?: number;
};

/** `PUT /tenants/:id/members/:memberId/contract` — upsert, partial fields
 *  only overwrite what's sent (tests/api/member-contract-core-v1.test.mjs).
 *  Gated by `requireTenantAdmin` (company_admin+), same as everything else
 *  Add Contractor's step 2 submits — not the `requireSuperAdminOnly` gate
 *  compensation uses. */
export async function updateMemberContract(
  tenantId: string,
  memberId: string,
  input: UpdateMemberContractInput
): Promise<MemberContract> {
  return requestApi<MemberContract>("PUT", `/tenants/${tenantId}/members/${memberId}/contract`, input);
}

/**
 * Two response shapes depending on whether `email` already has an account —
 * see `CoreMemberRow`/`CoreInviteResult`/`isPendingInvite` above. Both are
 * 201; `requestApi` doesn't distinguish, the caller does via
 * `isPendingInvite`.
 */
export async function createMember(
  tenantId: string,
  input: CreateMemberInput
): Promise<CoreMemberRow | CoreInviteResult> {
  return requestApi<CoreMemberRow | CoreInviteResult>("POST", `/tenants/${tenantId}/members`, input);
}

/**
 * `POST /tenants/:id/employees` (docs/api/add-employee-integration-guide.md
 * §2) — the "this person has no Thunder Core account yet" fast path: writes
 * `users` + `memberships` in one call and has Supabase email the invite
 * directly (`auth.admin.inviteUserByEmail`), unlike `/members`' own
 * `user_invitations`/`invite_url` mechanism. Confirmed live 2026-09-05 (code
 * merged via PR #44 to `origin/develop`, and thunder-core-api-2b verified
 * the backing migrations are applied on the real ThunderCore Supabase
 * project — not just present in git).
 *
 * `first_name`/`last_name`/`job_title`/`start_date` are required here (all
 * optional or nonexistent on `/members`) since this is the one path that
 * actually creates the `users` row those write to. Every field
 * `CreateMemberInput` accepts is also accepted here under the same name/type
 * except `default_location_id` (needs a real `locations` row — this app has
 * no locations lookup yet, so leave unset rather than send a UI label).
 *
 * Callers MUST fall back to `createMember` on a 409 (`email` already has an
 * account) — the guide recommends always trying `/employees` first and
 * treating 409 as "call `/members` instead," not as a hard error. See
 * `AddEmployeeWizardPage.handleSubmit` for that fallback wired end-to-end.
 */
export interface CreateEmployeeInput
  extends Omit<CreateMemberInput, "start_date" | "job_title"> {
  first_name: string;
  last_name: string;
  job_title: string;
  /** "YYYY-MM-DD" — required here, unlike `/members`. */
  start_date: string;
  default_location_id?: string;
  title_prefix?: string;
  first_name_en?: string;
  last_name_en?: string;
  gender?: "male" | "female" | "unspecified";
  /** PII — not returned on any GET/list per the integration guide. */
  national_id?: string;
  /** PII, same caveat as `national_id`. */
  passport_no?: string;
  nationality?: string;
  ethnicity?: string;
  /** "YYYY-MM-DD". */
  date_of_birth?: string;
  phone?: string;
  /** ≤200 chars. */
  address?: string;
}

/** Response shape per the integration guide's §2 example — a `CoreMemberRow`
 *  plus the employment-fields columns and the onboarding-progress summary
 *  Core computes at creation time. Never a `CoreInviteResult`: this endpoint
 *  always creates a real membership, so `isPendingInvite` on it is always
 *  `false` (safe to still call — it just won't match). */
export interface CoreEmployeeResult extends CoreMemberRow {
  default_location_id: string | null;
  member_type: string | null;
  lifecycle_stage: string | null;
  job_type: string | null;
  work_arrangement: string | null;
  probation_end_date: string | null;
  notes: string | null;
  onboarding: { done: number; total: number };
}

export async function createEmployee(tenantId: string, input: CreateEmployeeInput): Promise<CoreEmployeeResult> {
  return requestApi<CoreEmployeeResult>("POST", `/tenants/${tenantId}/employees`, input);
}

export interface MemberListPage {
  rows: CoreMemberRow[];
  count: number;
  page: number;
  limit: number;
}

export interface MemberListQuery {
  page?: number;
  limit?: number;
  /** The only filter Core supports today — full-text across
   *  users.email/first_name/last_name/display_name. Every other dropdown on
   *  PersonnelFilterBar stays decorative until Core adds server-side filters
   *  for them (flagged as a follow-up, not built). */
  search?: string;
}

export async function getMembers(
  token: string,
  tenantId: string,
  query: MemberListQuery = {}
): Promise<MemberListPage | null> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 25;
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (query.search) params.set("search", query.search);

  const data = await coreGet<{ data: CoreMemberRow[]; count: number }>(
    `/tenants/${tenantId}/members?${params.toString()}`,
    token
  );
  if (!data) return null;
  return { rows: data.data, count: data.count, page, limit };
}
