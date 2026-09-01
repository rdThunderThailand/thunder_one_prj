// Server-only reads for Core's /invites/accept SHA-256-token mechanism —
// contract confirmed 2026-09-01 via thundercore-prj-frontend-55 (their own
// working /invites/accept page, read from source on their side). Both
// functions fail open (`null`) on any transport/HTTP/shape failure, same
// philosophy as people/personnel/services/members-api.ts's coreGet — a
// Core hiccup should degrade to a clear "couldn't load this invite" state
// on the page, not crash it.
import { env } from "@/config/env";
import type { InviteDetails } from "../types/auth.types";

function authHeaders(token?: string) {
  const headers: Record<string, string> = { "x-api-key": env.coreApiKey };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** GET is deliberately unauthenticated in Core's contract — shown before
 *  the visitor has decided (or been able) to log in or register. */
export async function getInviteDetails(token: string): Promise<InviteDetails | null> {
  try {
    const res = await fetch(
      `${env.coreApiUrl}/api/core/v1/invites/accept?token=${encodeURIComponent(token)}`,
      { headers: authHeaders(), cache: "no-store" }
    );
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    const data = body?.data;
    if (!data || typeof data.email !== "string") return null;

    return {
      email: data.email,
      status: data.status,
      hasAccount: Boolean(data.has_account),
      tenantName: data.tenant?.name ?? null,
      roleName: data.role?.name ?? null,
      expiresAt: data.expires_at,
    };
  } catch {
    return null;
  }
}

/** Only meaningful when `sessionToken` is present — used to tell whether
 *  the currently-logged-in visitor (if any) is the same person the invite
 *  was sent to (docs: AcceptInviteClient.tsx's 3-way branch on this). */
export async function getCurrentUserEmail(sessionToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${env.coreApiUrl}/api/core/v1/session`, {
      headers: authHeaders(sessionToken),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    const email = body?.data?.user?.email;
    return typeof email === "string" ? email : null;
  } catch {
    return null;
  }
}
