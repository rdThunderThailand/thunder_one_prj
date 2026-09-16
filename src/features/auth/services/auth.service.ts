import { apiClient } from "@/lib/api/client";
import type {
  AcceptInvitePayload,
  LoginCredentials,
  RegisterAndAcceptInvitePayload,
  RegisterPayload,
  SetPasswordPayload,
} from "../types/auth.types";

export async function login(
  credentials: LoginCredentials,
): Promise<{ userId: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    throw new Error("Invalid email or password.");
  }

  const data = await res.json();
  return data;
}

// No backend exists yet — this calls placeholder endpoints and will throw
// until the API is implemented. RegisterForm already handles the rejection.

export async function register(payload: RegisterPayload): Promise<void> {
  await apiClient.post("/auth/register", payload);
}

/** Completes a Supabase invite (Add Employee flow) — real as of 2026-09-01,
 *  proxied through api/auth/set-password/route.ts to Core's actual
 *  POST /api/core/v1/auth/set-password (contract confirmed directly with
 *  Core, thunder-core-api-93). Sets the same `to_at` session cookie
 *  api/auth/login/route.ts does, so a successful call leaves the caller
 *  fully logged in, not just password-set. */
export async function setPassword({ accessToken, password }: SetPasswordPayload): Promise<{ userId: string }> {
  const res = await fetch("/api/auth/set-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ access_token: accessToken, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "This link has expired or was already used.");
  }

  return res.json();
}

/** Core's *other* invite mechanism (see types/auth.types.ts's header
 *  comment on AcceptInvitePayload) — for a visitor already logged in as
 *  the invited email. */
export async function acceptInvite({ token }: AcceptInvitePayload): Promise<void> {
  const res = await fetch("/api/invites/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Could not accept this invitation.");
  }
}

/** Same mechanism, for a brand-new invitee with no Core account yet —
 *  chains register/login/accept server-side, see api/invites/register/route.ts.
 *  Returns rather than throws on failure: unlike every other auth call
 *  here, this one has a real partial-success outcome (account created +
 *  logged in, but tenant membership not confirmed) the caller needs to
 *  branch on, not just display as an error string. */
export async function registerAndAcceptInvite(
  payload: RegisterAndAcceptInvitePayload
): Promise<{ ok: true } | { ok: false; error: string; signedIn: boolean }> {
  const res = await fetch("/api/invites/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return {
      ok: false,
      error: body?.error ?? "Could not complete registration.",
      signedIn: Boolean(body?.signedIn),
    };
  }
  return { ok: true };
}
