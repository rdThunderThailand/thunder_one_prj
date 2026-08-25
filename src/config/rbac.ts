import { redirect } from "next/navigation";
import type { RoleType, SessionResult } from "@/features/auth/services/get-session";

// Thunder One's own routing/access layer on top of Core's role_type tiers.
// Core has no page_view or permission concept of its own — this mapping is
// entirely this frontend's courtesy layer, not enforced anywhere in Core
// (see the rbac-role-vocabulary-reconciliation memory: no real permission
// gates exist yet). Getting this wrong sends someone to the wrong page; it
// opens no actual security hole, since every tenant-scoped request Core
// serves still enforces its own boundary regardless of what this resolves to.

export interface ResolvedRole {
  roleType: RoleType | null;
  /** The winning membership role's `roles.code` (e.g. "operator_technician",
   * a tenant-authored persona code like "CEO"). Layer 2 of RBAC — finer than
   * roleType, used for display and as groundwork for code-level gates later;
   * access gates below still key on roleType only (unchanged this round). */
  roleCode: string | null;
  /** The winning membership role's `roles.name` — preferred display label. */
  roleName: string | null;
}

/** Reduces a getSession() result to the shape every function below takes. */
export function resolveRole(session: SessionResult): ResolvedRole {
  return session === "forbidden" ? { roleType: null, roleCode: null, roleName: null } : session;
}

const CEO_PAGE_DEFAULT = "/mission-control";
const EMPLOYEE_PAGE_DEFAULT = "/my-work";

/**
 * The "CEO / Executive" tier. company_admin is Thunder One's CEO/Owner role
 * (mission-control's own README calls it that); executive_viewer must have
 * *exactly* the same page access as it (Nie, 2026-08-25) — expressed as one
 * literal set both belong to, rather than two lists that could drift apart.
 * super_admin (platform tier, strictly above company_admin) and tenant/system
 * (raw, unreconciled role_types — see the rbac-role-vocabulary-reconciliation
 * memory) are included too, only so this set exactly matches who "/" already
 * lands on Mission Control below; splitting those out is a separate decision
 * nobody has made yet.
 */
const CEO_EXECUTIVE_ROLES: ReadonlySet<RoleType> = new Set([
  "super_admin",
  "company_admin",
  "executive_viewer",
  "tenant",
  "system",
]);

export function isCeoExecutiveRole(roleType: RoleType | null): boolean {
  return roleType !== null && CEO_EXECUTIVE_ROLES.has(roleType);
}

/**
 * Layer 2 (roleCode) overrides for the manager/employee shell variants,
 * checked *first* by resolveLandingPage/resolveShellVariant/requireShellAccess
 * below. Confirmed live 2026-08-25: logging in as manager_it_asset still
 * landed on the CEO variant, because its role_type isn't one of our 8 known
 * tiers (isKnownRoleType in get-session.ts resolves it to null) — but
 * roleCode survives that (same fix as the header-label bug that day), so
 * code is the reliable signal here until each of these roles' real
 * role_type is confirmed via Core's `/tenants/{id}/roles` and added to the
 * tier switch properly. department_sale_admin/employee_media are listed
 * defensively too — their role_type is *assumed* to resolve to
 * department_admin/operator respectively, but that's likewise unverified
 * against a real login.
 */
const MANAGER_ROLE_CODES: ReadonlySet<string> = new Set(["manager_it_asset", "department_sale_admin"]);
const EMPLOYEE_ROLE_CODES: ReadonlySet<string> = new Set(["employee_media"]);

/**
 * Where "/" sends each role — the single source of truth the root page and
 * every access gate below reuse, so "who lands here" and "who's allowed
 * here" can never quietly drift apart from each other.
 */
export function resolveLandingPage(resolved: ResolvedRole): string {
  const { roleType, roleCode } = resolved;

  // Checked before the role_type switch below, for the same reason
  // requireShellAccess checks roleCode first: whichever role_type
  // manager_it_asset/department_sale_admin/employee_media actually turn out
  // to have, they must land on a page resolveShellVariant then gives them
  // their own variant on — never somewhere it would disagree with. See
  // MANAGER_ROLE_CODES' docstring below for why roleCode is the reliable
  // signal here. Manager still lands on Mission Control, unchanged; employee
  // lands on My Work instead (Nie, 2026-08-25) — both pages have an employee
  // variant, but My Work is the more useful first screen for that persona.
  if (roleCode !== null && MANAGER_ROLE_CODES.has(roleCode)) {
    return CEO_PAGE_DEFAULT;
  }
  if (roleCode !== null && EMPLOYEE_ROLE_CODES.has(roleCode)) {
    return EMPLOYEE_PAGE_DEFAULT;
  }

  switch (roleType) {
    case "super_admin":
    case "company_admin":
    case "executive_viewer":
    case "tenant":
    case "system":
      return CEO_PAGE_DEFAULT;

    // NOT /intelligence: that page is CEO/Executive-gated (requireCeoAccess),
    // and viewer_auditor isn't in that set — landing a role on a page its own
    // gate then bounces it away from is an infinite redirect loop (hit for
    // real 2026-08-25, a different role tripping the same class of bug —
    // see isKnownRoleType's docstring in get-session.ts). Every case here
    // must point at a page that role is actually allowed on.
    case "viewer_auditor":
      return "/governance";

    case "department_admin":
      return "/asset-intelligence/departments";

    case "operator":
      return roleCode === "operator_technician" ? "/thunder-care/work-orders" : "/asset-intelligence/assets";

    case null:
    default:
      return CEO_PAGE_DEFAULT;
  }
}

/**
 * Call at the top of every CEO/Executive-only page — as of 2026-08-25 that's
 * down to just Mission Control's 3 sub-pages (Approvals/Insights/Reports).
 * Mission Control, My Work, Intelligence, and Workspaces themselves all
 * moved to requireShellAccess below once each grew a manager variant.
 * Redirects anyone outside the CEO/Executive tier to their own role's
 * landing page instead — a real gate, not just the courtesy default "/"
 * used before this existed.
 *
 * `roleType: null` (Core unreachable, or role resolution failed) fails
 * OPEN, same philosophy as getSession() itself: a Core outage degrades
 * gracefully, it does not lock everyone out on top of it.
 */
export function requireCeoAccess(resolved: ResolvedRole): void {
  if (resolved.roleType === null) return;
  if (isCeoExecutiveRole(resolved.roleType)) return;
  redirect(resolveLandingPage(resolved));
}

export type ShellVariant = "ceo" | "manager" | "employee";

/**
 * Mission Control and My Work are shared shell pages whose content adapts
 * per role, not pages one tier owns and everyone else is gated out of (Nie,
 * 2026-08-25: "each role should already see something different from the
 * moment they enter the shell"). department_admin ("manager" — the tier
 * behind personas like department_sale_admin) gets its own variant on
 * role_type alone; every other role still goes through requireCeoAccess
 * unchanged (Intelligence, Workspaces, and Mission Control's own sub-pages
 * are not part of this yet).
 *
 * "employee" is deliberately NOT given a role_type-level fallback the way
 * "manager" is: role_type "operator" also covers personas with completely
 * different content needs (e.g. operator_technician — Thunder Care), so
 * only the specific roleCode "employee_media" (EMPLOYEE_ROLE_CODES above)
 * opts into the employee variant. A broader operator-tier fallback would
 * show Marketing-flavored content to a technician.
 */
const MANAGER_ROLES: ReadonlySet<RoleType> = new Set(["department_admin"]);

/** Unresolved role (null) defaults to "ceo" — same fail-open landing choice
 * "/" already made before variants existed. */
export function resolveShellVariant({ roleType, roleCode }: ResolvedRole): ShellVariant {
  if (roleCode !== null && MANAGER_ROLE_CODES.has(roleCode)) return "manager";
  if (roleCode !== null && EMPLOYEE_ROLE_CODES.has(roleCode)) return "employee";
  if (roleType !== null && MANAGER_ROLES.has(roleType)) return "manager";
  return "ceo";
}

/** Redirects away only when role is known and belongs to no variant. */
export function requireShellAccess(resolved: ResolvedRole): void {
  const { roleType, roleCode } = resolved;
  if (roleType === null) return;
  if (roleCode !== null && (MANAGER_ROLE_CODES.has(roleCode) || EMPLOYEE_ROLE_CODES.has(roleCode))) return;
  if (isCeoExecutiveRole(roleType) || MANAGER_ROLES.has(roleType)) return;
  redirect(resolveLandingPage(resolved));
}

// Fallback only — used when a membership's role row has no `name` set.
// Real data (e.g. Thunder Enterprise Master's CEO / manager_it_asset /
// department_sale_admin / employee_media roles) carries its own `name`,
// which resolveRoleLabel prefers below; this generic tier label is not
// meant to be seen once every role in use has a proper name.
const ROLE_TYPE_FALLBACK_LABEL: Record<RoleType, string> = {
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  executive_viewer: "Executive",
  viewer_auditor: "Auditor",
  department_admin: "Department Manager",
  operator: "Operator",
  tenant: "Tenant Admin",
  system: "System",
};

/**
 * What the Topbar profile shows under the user's name. Shows the specific
 * role's `roles.name` (e.g. "CEO") rather than the generic role_type tier
 * (e.g. "company_admin") — Nie, 2026-08-25: the tier must never be shown as
 * the label. Falls back to a generic tier label only if this membership's
 * role row has no `name`. Null renders no subtitle at all.
 */
export function resolveRoleLabel({ roleType, roleName }: ResolvedRole): string | null {
  if (roleName) return roleName;
  if (roleType === null) return null;
  return ROLE_TYPE_FALLBACK_LABEL[roleType];
}
