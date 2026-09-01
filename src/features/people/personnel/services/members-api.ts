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
// No `member_type` field exists in Core's schema yet (confirmed) — every row
// here has no reliable Employee/Contractor/Partner/Guest distinction. See
// ../core-mapper.ts, which defaults every real row's `type` to `"employee"`
// rather than guessing; that mapping decision lives there, not in this file.
//
// `createMember` (the POST side) is client-safe — unlike the GET functions
// above, it goes through requestApi/the `/api/proxy` route rather than
// fetching Core directly, so it can be called from a "use client" component
// (people/personnel's AddPersonModal, people/new-hires's AddEmployeeModal)
// the same way asset-intelligence/assets/services/assets-api.ts's
// createAsset does.
import { requestApi } from "@/lib/api/media-api";
import { env } from "@/config/env";

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

function authHeaders(token: string) {
  return { "x-api-key": env.coreApiKey, Authorization: `Bearer ${token}` };
}

/** Fails open (`null`) on any transport/HTTP/shape failure — same philosophy
 *  as asset-intelligence/assets/services/asset-list-api.ts's coreGet. */
async function coreGet<T>(path: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(`${env.coreApiUrl}/api/core/v1${path}`, {
      headers: authHeaders(token),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return (body?.data as T) ?? null;
  } catch {
    return null;
  }
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
