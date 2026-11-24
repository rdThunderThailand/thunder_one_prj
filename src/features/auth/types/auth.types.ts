export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** `accessToken` is the invite's own short-lived Supabase access token, read
 *  from the `#access_token=...` URL fragment Supabase's invite email link
 *  redirects to — not a Thunder One session token. See
 *  SetPasswordForm's own comment for why it's a fragment, not a query param. */
export interface SetPasswordPayload {
  accessToken: string;
  password: string;
}

// Core's *other* invite mechanism — its own `user_invitations` table + a
// SHA-256 token (docs/api/add-employee-integration-guide.md explicitly
// doesn't cover this one; contract confirmed 2026-09-01 via
// thundercore-prj-frontend-55, whose own /invites/accept page is the
// reference implementation this one is ported from). Unrelated to
// SetPasswordPayload above — that's the newer Supabase-based /employees
// flow, this is the pre-existing /members one, still the one actually in
// use until /employees is deployed.
export type InviteStatus = "pending" | "expired" | "accepted" | "cancelled";

export interface InviteDetails {
  email: string;
  status: InviteStatus;
  hasAccount: boolean;
  tenantName: string | null;
  roleName: string | null;
  expiresAt: string;
}

/** For an already-logged-in user accepting an invite that matches their own
 *  email — no registration needed. */
export interface AcceptInvitePayload {
  token: string;
}

/** For a brand-new invitee with no Core account yet — chains
 *  register → login → accept server-side in one call (see
 *  api/invites/register/route.ts's own comment for why it's one call, not
 *  three round trips). */
export interface RegisterAndAcceptInvitePayload {
  token: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
