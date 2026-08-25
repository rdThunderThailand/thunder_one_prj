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
  roleType: RoleType | null;
  /** The winning role's `roles.code` — e.g. "operator_technician", "manager_it_asset",
   * or a tenant-authored persona code like "CEO". Finer-grained than roleType (the tier);
   * not yet used for access gates (those stay keyed on roleType), only for display and
   * as a foundation for a second, code-level RBAC layer later. */
  roleCode: string | null;
  /** The winning role's `roles.name` — the human-readable label to show in the UI
   * (e.g. Topbar), preferred over any generic tier label. */
  roleName: string | null;
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
 */
export async function getSession(): Promise<SessionResult> {
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
    return { userName: FALLBACK_NAME, userId: null, tenantName: null, ...NO_ROLE };
  }

  if (sessionRes.status === 401) {
    redirect("/login");
  }
  if (sessionRes.status === 403) {
    return "forbidden";
  }
  if (!sessionRes.ok) {
    return { userName: FALLBACK_NAME, userId: null, tenantName: null, ...NO_ROLE };
  }

  const body = await sessionRes.json().catch(() => null);
  const user = body?.data?.user;
  const tenantId: string | null = body?.data?.tenant?.id ?? null;
  const tenantName: string | null = body?.data?.tenant?.name ?? null;
  const role = await resolveRole(membershipsRes, tenantId);

  if (!user) {
    return { userName: FALLBACK_NAME, userId: null, tenantName, ...role };
  }

  const userId = typeof user.id === "string" ? user.id : null;
  return { userName: resolveUserName(user), userId, tenantName, ...role };
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
 * when Core has neither a display_name nor a first/last name for the user. */
function resolveUserName(user: Record<string, unknown>): string {
  const displayName = String(user.display_name ?? "").trim();
  if (displayName) return displayName;

  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  if (fullName) return fullName;

  return FALLBACK_NAME;
}
