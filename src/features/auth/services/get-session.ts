import { cache } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { env } from "@/config/env";

// Core's role_type tier system (thunder_core_prj's src/utils/supabase/rbac.ts).
// department_admin/tenant/system exist as raw DB values (thunder_core_prj's
// src/lib/core/member-view.ts notes the live DB has them) but aren't part of
// Core's own typed/prioritized tier system yet.
export type RoleType =
  | "super_admin"
  | "company_admin"
  | "executive_viewer"
  | "operator"
  | "viewer_auditor"
  | "department_admin"
  | "tenant"
  | "system";

export interface Session {
  userName: string;
  /** `public.users.id` — the same id `created_by` carries on every media row, so the
   *  playlists page can tell "mine" from "everyone's" without a second lookup. */
  userId: string | null;
  tenantName: string | null;
  /** `public.tenants.id` — needed for any additional tenant-scoped Core call a
   *  page makes beyond session/membership (e.g. `GET /tenants/{id}/assets/*`).
   *  Pair with `getAuthToken()` below rather than re-deriving the token. */
  tenantId: string | null;
  roleType: RoleType | null;
  /** The winning role's `roles.code` — e.g. "operator_technician", "manager_it_asset",
   * or a tenant-authored persona code like "CEO". Finer-grained than roleType (the tier);
   * not yet used for access gates (those stay keyed on roleType), only for display and
   * as a foundation for a second, code-level RBAC layer later. */
  roleCode: string | null;
  /** The winning role's `roles.name` — the human-readable label to show in the UI
   * (e.g. Topbar), preferred over any generic tier label. */
  roleName: string | null;
  /** The caller's own `job_title` on their current tenant's membership row
   * (e.g. "Senior Software Engineer") — the same field Personnel reads/
   * writes, not an RBAC concept. Neither `/session` nor `/me/memberships`
   * carry it, so it's a best-effort lookup against `/tenants/:id/members`
   * (see `resolveMembershipExtras` below); `null` when the member has none
   * set or the lookup failed. The Topbar prefers this over `roleName` — a
   * person's actual position reads better under their name than their
   * access tier. */
  jobTitle: string | null;
}

/**
 * `"forbidden"` means the account is authenticated but holds no membership in a
 * tenant this application serves (ADR 0007) — a different outcome from "not
 * logged in", and the caller must not treat it as one.
 */
export type SessionResult = Session | "forbidden";

const FALLBACK_NAME = "Account";
const NO_ROLE = { roleType: null, roleCode: null, roleName: null } as const;

// Mirrors Core's own priority order (thunder_core_prj's src/lib/core/member-view.ts
// toPrimaryRole — not the buggy src/utils/supabase/rbac.ts getUserRole, which
// starts its "best so far" at priority 0 and so silently mis-resolves a
// department_admin-only user to "operator"). Types absent here score 0 via
// `?? 0` below rather than being dropped, so they still surface when nothing
// higher-priority exists.
const ROLE_PRIORITY: Partial<Record<RoleType, number>> = {
  super_admin: 100,
  company_admin: 70,
  executive_viewer: 50,
  viewer_auditor: 20,
  operator: 10,
};

const KNOWN_ROLE_TYPES = new Set<string>([
  "super_admin",
  "company_admin",
  "executive_viewer",
  "operator",
  "viewer_auditor",
  "department_admin",
  "tenant",
  "system",
]);

/**
 * Validates a raw `role_type` string against the known union at runtime — a
 * bare `as RoleType` cast let any unrecognized Core value through disguised
 * as a real tier, which (via resolveLandingPage's default case pointing at a
 * gated page) caused an infinite redirect loop the first time a role whose
 * `role_type` didn't match one of these 8 logged in. Better to resolve to no
 * role (fails open — see getSession's docstring) than to trust an unchecked
 * string.
 */
function isKnownRoleType(value: string): value is RoleType {
  return KNOWN_ROLE_TYPES.has(value);
}

/**
 * Single bootstrap call for the authenticated shell: resolves the display name,
 * the tenant, and the caller's role in this tenant (ADR 0008 covers name+tenant;
 * role is a second, parallel call to Core's `/me/memberships` since `/session`
 * deliberately does not return it — see that ADR's "Findings deliberately not
 * acted on").
 *
 * Fails open on transport or server errors, for both calls — a Core outage
 * should degrade the Topbar to a generic name and role-based routing to its
 * default, not lock every user out of the app. Real access denials arrive as
 * an explicit 403, and each tenant-scoped request enforces the boundary again
 * on its own, so nothing is trusted to this check alone. Role resolution here
 * is a courtesy for picking a landing page, not a permission gate.
 *
 * ครอบด้วย `React.cache()` (ดูท้ายไฟล์) — (dashboard)/layout.tsx เรียกฟังก์ชัน
 * นี้ทุกหน้าอยู่แล้วเพื่อ gate การเข้าถึง แล้วเกือบทุก page.tsx ใน People
 * Workspace (add/employee, add/contractor, add/bulk, personnel,
 * org-structure ฯลฯ) ก็เรียกซ้ำอีกรอบเพื่อเอา tenantId — ถ้าไม่ cache จะยิง
 * `/session` + `/me/memberships` สองรอบไปที่ Core ทุกครั้งที่โหลดหน้า โดยได้
 * ผลลัพธ์เดิมเป๊ะทั้งสองรอบ (cookie เดียวกันภายใน request เดียวกัน).
 */
async function getSessionUncached(): Promise<SessionResult> {
  const token = (await cookies()).get("to_at")?.value;
  if (!token) {
    redirect("/login");
  }

  const authHeaders = {
    "x-api-key": env.coreApiKey,
    Authorization: `Bearer ${token}`,
  };

  let sessionRes: Response;
  let membershipsRes: Response | null;
  try {
    [sessionRes, membershipsRes] = await Promise.all([
      fetch(`${env.coreApiUrl}/api/core/v1/session`, { headers: authHeaders, cache: "no-store" }),
      fetch(`${env.coreApiUrl}/api/core/v1/me/memberships`, { headers: authHeaders, cache: "no-store" }).catch(
        () => null,
      ),
    ]);
  } catch {
    return { userName: FALLBACK_NAME, userId: null, tenantName: null, tenantId: null, ...NO_ROLE, jobTitle: null };
  }

  if (sessionRes.status === 401) {
    redirect("/login");
  }
  if (sessionRes.status === 403) {
    return "forbidden";
  }
  if (!sessionRes.ok) {
    return { userName: FALLBACK_NAME, userId: null, tenantName: null, tenantId: null, ...NO_ROLE, jobTitle: null };
  }

  const body = await sessionRes.json().catch(() => null);
  const user = body?.data?.user;
  const tenantId: string | null = body?.data?.tenant?.id ?? null;
  const tenantName: string | null = body?.data?.tenant?.name ?? null;
  const userEmail = typeof user?.email === "string" ? user.email : null;
  const rawUserId = typeof user?.id === "string" ? user.id : null;
  const [role, membershipExtras] = await Promise.all([
    resolveRole(membershipsRes, tenantId),
    resolveMembershipExtras(authHeaders, tenantId, userEmail, rawUserId),
  ]);
  const { jobTitle } = membershipExtras;

  if (!user) {
    return { userName: FALLBACK_NAME, userId: null, tenantName, tenantId, ...role, jobTitle };
  }

  const userId = typeof user.id === "string" ? user.id : null;
  return { userName: resolveUserName(user, membershipExtras), userId, tenantName, tenantId, ...role, jobTitle };
}

/**
 * Best-effort lookup of two fields neither `/session` nor `/me/memberships`
 * carry: the caller's `job_title` on their current tenant's membership, and
 * their `first_name_th`/`last_name_th` (both live on the `/tenants/:id/
 * members` list row's nested `user` — same shape Personnel already reads,
 * and the same row already needed for job_title, so this is one lookup for
 * both rather than two). Rather than pulling the whole roster just for a
 * couple of fields, this reuses that endpoint's own `search` filter (by
 * email, unique per account) to narrow it to a handful of rows, then
 * confirms the match by `user.id` before trusting it, since `search`'s
 * match semantics aren't a guaranteed-exact `user_id` filter. Returns all
 * `null` (callers fall back to their non-Thai/RBAC defaults) on any failure
 * — this is a display nicety, not worth failing the whole session over.
 */
async function resolveMembershipExtras(
  authHeaders: Record<string, string>,
  tenantId: string | null,
  email: string | null,
  userId: string | null,
): Promise<{ jobTitle: string | null; firstNameTh: string | null; lastNameTh: string | null }> {
  const empty = { jobTitle: null, firstNameTh: null, lastNameTh: null };
  if (!tenantId || !email || !userId) return empty;
  try {
    const res = await fetch(
      `${env.coreApiUrl}/api/core/v1/tenants/${tenantId}/members?limit=5&search=${encodeURIComponent(email)}`,
      { headers: authHeaders, cache: "no-store" },
    );
    if (!res.ok) return empty;
    const body = await res.json().catch(() => null);
    const rows: Array<{ job_title?: unknown; user?: { id?: unknown; first_name_th?: unknown; last_name_th?: unknown } }> =
      body?.data?.data ?? [];
    const match = rows.find((r) => r.user?.id === userId);
    if (!match) return empty;
    const jobTitle = typeof match.job_title === "string" && match.job_title.trim() ? match.job_title : null;
    const firstNameTh =
      typeof match.user?.first_name_th === "string" && match.user.first_name_th.trim() ? match.user.first_name_th : null;
    const lastNameTh =
      typeof match.user?.last_name_th === "string" && match.user.last_name_th.trim() ? match.user.last_name_th : null;
    return { jobTitle, firstNameTh, lastNameTh };
  } catch {
    return empty;
  }
}

/** Public entry point — memoized per request via `React.cache()`. See
 *  `getSessionUncached`'s docstring above for why. `redirect()` inside the
 *  wrapped function still works correctly: it throws to interrupt rendering
 *  rather than returning a value, so there's nothing for `cache()` to
 *  memoize on that path, and in practice it only ever fires from the
 *  layout's call — the one that runs first in any request. */
export const getSession = cache(getSessionUncached);

/** Same `to_at` cookie `getSession()` reads, exposed for pages that need to
 *  make an additional tenant-scoped Core call beyond session/membership
 *  (e.g. the Asset List page's list/summary/filters endpoints) without a
 *  second round-trip to derive it. */
export async function getAuthToken(): Promise<string | null> {
  return (await cookies()).get("to_at")?.value ?? null;
}

/** One membership row from `GET /me/memberships`, loosely typed — it's an external response. */
interface MembershipRow {
  tenant_id?: string;
  membership_roles?: {
    roles?: { role_type?: string; code?: string; name?: string } | { role_type?: string; code?: string; name?: string }[];
  }[];
}

async function resolveRole(
  membershipsRes: Response | null,
  tenantId: string | null,
): Promise<{ roleType: RoleType | null; roleCode: string | null; roleName: string | null }> {
  if (!membershipsRes?.ok || !tenantId) return NO_ROLE;

  const body = await membershipsRes.json().catch(() => null);
  const memberships: MembershipRow[] = Array.isArray(body?.data) ? body.data : [];
  const membership = memberships.find((m) => m.tenant_id === tenantId);
  if (!membership) return NO_ROLE;

  let bestType: RoleType | null = null;
  let bestPriority = -1;
  let bestCode: string | null = null;
  let bestName: string | null = null;

  // Display fallback: the first code/name seen, regardless of whether its
  // role_type is one we recognize. Whether a role_type is a *known tier* only
  // matters for routing/access decisions (isKnownRoleType guards those below)
  // — showing "CEO" in the header doesn't need role_type validated at all,
  // so an unrecognized tier must not blank out a perfectly real code/name.
  let anyCode: string | null = null;
  let anyName: string | null = null;

  for (const mr of membership.membership_roles ?? []) {
    const rolesField = mr.roles;
    const role = Array.isArray(rolesField) ? rolesField[0] : rolesField;
    const code = typeof role?.code === "string" ? role.code : null;
    const name = typeof role?.name === "string" ? role.name : null;
    if (anyCode === null && anyName === null && (code !== null || name !== null)) {
      anyCode = code;
      anyName = name;
    }

    const rawRoleType = role?.role_type;
    if (!rawRoleType || !isKnownRoleType(rawRoleType)) continue;
    const roleType = rawRoleType;

    const priority = ROLE_PRIORITY[roleType] ?? 0;
    if (priority > bestPriority) {
      bestPriority = priority;
      bestType = roleType;
      bestCode = code;
      bestName = name;
    }
  }

  return { roleType: bestType, roleCode: bestCode ?? anyCode, roleName: bestName ?? anyName };
}

/** Never falls back to `user.email` — an email address isn't a display name,
 * and showing one in the Topbar profile chip is exactly what Nie asked to
 * stop happening (2026-08-25). Falls to the generic `FALLBACK_NAME` instead
 * when Core has neither a display_name nor a first/last name for the user.
 *
 * Prefers the Thai name (`extras`, from `resolveMembershipExtras`) over
 * `display_name` when `preferred_language` is "th" and one is actually set
 * — same real-field-driven preference `ProfilePage` uses, so the Topbar and
 * Profile agree instead of one silently staying English (Nie, 2026-09-16). */
function resolveUserName(
  user: Record<string, unknown>,
  extras: { firstNameTh: string | null; lastNameTh: string | null },
): string {
  const preferredLanguage = typeof user.preferred_language === "string" ? user.preferred_language : null;
  const thaiName = [extras.firstNameTh, extras.lastNameTh].filter(Boolean).join(" ");
  if (preferredLanguage === "th" && thaiName) return thaiName;

  const displayName = String(user.display_name ?? "").trim();
  if (displayName) return displayName;

  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  if (fullName) return fullName;

  return FALLBACK_NAME;
}
