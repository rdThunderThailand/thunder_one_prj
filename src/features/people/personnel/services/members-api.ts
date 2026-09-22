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
  /** Confirmed real 2026-09-16 — added to `MEMBER_SELECT`/`toMemberView` in
   *  `thunder_core_API` commit `489c3b1` (round-trip: write via
   *  `updateMemberSchema`, read back here). `position_code` e.g. "POS-CEO",
   *  `level_role` e.g. "Executive"/"Senior" — plain free text, not a closed
   *  set on Core's side. */
  position_code: string | null;
  level_role: string | null;
  default_department_id: string | null;
  start_date: string | null;
  role_code: string | null;
  role_type: string | null;
  /** Confirmed 2026-09-15 by reading `MEMBER_SELECT` in `thunder_core_API`'s
   *  `src/lib/core/member-view.ts` directly — this was already real and
   *  already returned by `GET /tenants/:id/members`; this frontend's own
   *  type just hadn't been updated to include it since the 2026-08-28
   *  resolution (docs/people/add-contractor-and-bulk-field-requirements.md).
   *  `null` on rows created before that column existed. */
  member_type: "employee" | "contractor" | "partner" | "guest" | null;
  /** Same "already in MEMBER_SELECT, frontend type just hadn't caught up"
   *  story as member_type above — confirmed 2026-09-15. "YYYY-MM-DD" or
   *  `null`. Used to derive the "พนักงานทดลองงาน" tab/badge: on probation
   *  when set and not yet passed. */
  probation_end_date: string | null;
  user: {
    id: string;
    email: string;
    full_name: string;
    /** Real since 2026-09-16 — `thunder_core_API` commit `f15d612` added
     *  these to `fetchUsers()`'s select (feeds `toMemberView`'s embedded
     *  `user` object), closing the write-only gap `first_name_th`/
     *  `last_name_th` had when first added in `489c3b1`. An explicit
     *  Thai-script name pair, separate from `full_name` (which still falls
     *  back through display_name → composed first_name/last_name → the
     *  romanized names a 2026-09 bulk import wrote into those). */
    first_name_th: string | null;
    last_name_th: string | null;
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
  /** Real since 2026-09-16 — see `CoreMemberRow`'s own comment. */
  position_code?: string;
  level_role?: string;
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
/** `PATCH /tenants/:id/members/:memberId` — proposed 2026-09-14
 *  (docs/people/edit-member-department-job-title-field-requirements.md),
 *  scoped to the two fields blocking real onboarding: a bulk-created
 *  member's placeholder department/job_title need fixing per-person
 *  afterward, and there was no endpoint at all to do that (Core's
 *  `members/[memberId]/route.ts` only had `GET`/`DELETE`). Partial —
 *  omitted fields are left unchanged, same convention as
 *  `updateMemberContract`. Not yet confirmed live on Core's side; a 404
 *  here means the endpoint hasn't shipped yet, same "build ahead of Core,
 *  degrade gracefully" pattern as asset-intelligence/assets's
 *  `EditAssetModal`/`updateAsset`. */
export interface UpdateMemberInput {
  default_department_id?: string | null;
  job_title?: string | null;
  /** Proposed 2026-09-15 — same `memberships.start_date` column the
   *  create-time flows already write, just no way to fix it after the fact
   *  until now. "YYYY-MM-DD". Not yet confirmed live on Core's side — see
   *  this file's own updateMember() comment for the "build ahead, 404
   *  gracefully" pattern. */
  start_date?: string | null;
  /** Real since 2026-09-16 — see `CoreMemberRow`'s own comment. */
  position_code?: string | null;
  level_role?: string | null;
}

export async function updateMember(
  tenantId: string,
  memberId: string,
  input: UpdateMemberInput
): Promise<CoreMemberRow> {
  return requestApi<CoreMemberRow>("PATCH", `/tenants/${tenantId}/members/${memberId}`, input);
}

export async function createMember(
  tenantId: string,
  input: CreateMemberInput
): Promise<CoreMemberRow | CoreInviteResult> {
  return requestApi<CoreMemberRow | CoreInviteResult>("POST", `/tenants/${tenantId}/members`, input);
}

/**
 * Real since 2026-09-15 (UAT PP02-009) — lets the Add Employee/Contractor
 * wizards flag a duplicate email before the final submit, instead of only
 * finding out from `createEmployee`/`createMember`'s 409 at the very end.
 * Client-safe (goes through `/api/proxy`, like `createMember` above), reusing
 * the same `?search=` filter `getMembers` uses server-side — that's a
 * substring match across email/first_name/last_name/display_name, so the
 * rows it returns are checked for an exact (case-insensitive) email match
 * here rather than trusting `count > 0` on its own.
 */
export async function checkEmailTaken(tenantId: string, email: string): Promise<boolean> {
  const result = await requestApi<{ data: CoreMemberRow[]; count: number }>(
    "GET",
    `/tenants/${tenantId}/members?search=${encodeURIComponent(email)}&limit=10`
  );
  const target = email.trim().toLowerCase();
  return result.data.some((row) => row.user.email.toLowerCase() === target);
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
  /** Real since 2026-09-16 — explicit Thai-script name pair, distinct from
   *  `first_name`/`last_name` above (still the primary/fallback name).
   *  See `CoreMemberRow.user`'s own comment for why this field exists. */
  first_name_th?: string;
  last_name_th?: string;
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
  /** Full-text across users.email/first_name/last_name/display_name. */
  search?: string;
  /** Real server-side filter since 2026-09-17 (Core commit de57b3e) — one of
   *  `CoreMemberRow["status"]`'s 5 real values. PersonnelFilterBar's own
   *  "สถานะการทำงาน" has a 4th, "inactive", that Core has no single status
   *  for (it's `removed` OR `archived` — see personnel/core-mapper.ts's
   *  STATUS_MAP); that one option stays client-side-filtered, everything
   *  else here is a real round trip. */
  status?: "invited" | "active" | "suspended" | "removed" | "archived";
  /** Real server-side filter since 2026-09-17 (Core commit de57b3e). Same
   *  caveat as `status` — PersonnelFilterBar's "inactive" ประเภทบุคลากร
   *  option is derived from `status`, not a real `member_type` value, so it
   *  can't be expressed here either. */
  member_type?: "employee" | "contractor" | "partner" | "guest";
  /** Real server-side filter since 2026-09-17 (Core commit de57b3e). Not yet
   *  wired up from PersonnelFilterBar's หน่วยงาน dropdown — that dropdown
   *  currently works off a display label, not a department id (see
   *  PersonnelPage.tsx), so switching it to use this needs its own
   *  follow-up rather than being folded into this pass. */
  department_id?: string;
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
  if (query.status) params.set("status", query.status);
  if (query.member_type) params.set("member_type", query.member_type);
  if (query.department_id) params.set("department_id", query.department_id);

  const data = await coreGet<{ data: CoreMemberRow[]; count: number }>(
    `/tenants/${tenantId}/members?${params.toString()}`,
    token
  );
  if (!data) return null;
  return { rows: data.data, count: data.count, page, limit };
}
