// Real Thunder_Core integration for the Org Structure page
// (/people/org-structure) — server-only, same "reads the session cookie's
// bearer token via get-session.ts's getAuthToken(), passed in explicitly"
// shape as asset-intelligence/assets/services/asset-list-api.ts.
//
// Contract confirmed directly with Core 2026-08-28 (docs/people/
// core-response-people-workspace-api.md, "GET /tenants/:id/organizations"):
// the response is already a full nested tree (not flat rows + parentId).
// `manager_id` was added to this route's select list the same day (Q9
// follow-up) — it's a raw `public.users.id`, NOT a membership id, so
// resolving it to a name means matching against a members row's `user_id`
// field, not `id` (core-mapper.ts does this).
import { env } from "@/config/env";

export interface CoreOrgUnit {
  id: string;
  parent_department_id: string | null;
  code: string | null;
  name: string;
  name_en: string | null;
  department_type: string | null;
  status: string;
  is_root: boolean;
  sort_order: number | null;
  /** `public.users.id` of the unit's manager, or `null`. Match against a
   *  `CoreMemberRow.user_id` (not `.id`, the membership id) to resolve a name. */
  manager_id: string | null;
  children: CoreOrgUnit[];
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

export async function getOrganizations(token: string, tenantId: string): Promise<CoreOrgUnit[] | null> {
  return coreGet<CoreOrgUnit[]>(`/tenants/${tenantId}/organizations`, token);
}
