import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export interface Session {
  userName: string;
  /** `public.users.id` — the same id `created_by` carries on every media row, so the
   *  playlists page can tell "mine" from "everyone's" without a second lookup. */
  userId: string | null;
  tenantName: string | null;
}

/**
 * `"forbidden"` means the account is authenticated but holds no membership in a
 * tenant this application serves (ADR 0007) — a different outcome from "not
 * logged in", and the caller must not treat it as one.
 */
export type SessionResult = Session | "forbidden";

const FALLBACK_NAME = "Account";

/**
 * Single bootstrap call for the authenticated shell: resolves the display name
 * and the tenant in one round-trip (ADR 0008).
 *
 * Fails open on transport or server errors — a Core outage should degrade the
 * Topbar to a generic name, not lock every user out of the app. Real access
 * denials arrive as an explicit 403, and each tenant-scoped request enforces
 * the boundary again on its own, so nothing is trusted to this check alone.
 */
export async function getSession(): Promise<SessionResult> {
  const token = (await cookies()).get("to_at")?.value;
  if (!token) {
    redirect("/login");
  }

  let res: Response;
  try {
    res = await fetch(`${env.coreApiUrl}/api/core/v1/session`, {
      headers: {
        "x-api-key": env.coreApiKey,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    return { userName: FALLBACK_NAME, userId: null, tenantName: null };
  }

  if (res.status === 401) {
    redirect("/login");
  }
  if (res.status === 403) {
    return "forbidden";
  }
  if (!res.ok) {
    return { userName: FALLBACK_NAME, userId: null, tenantName: null };
  }

  const body = await res.json().catch(() => null);
  const user = body?.data?.user;
  const tenantName = body?.data?.tenant?.name ?? null;

  if (!user) {
    return { userName: FALLBACK_NAME, userId: null, tenantName };
  }

  const userId = typeof user.id === "string" ? user.id : null;
  return { userName: resolveUserName(user), userId, tenantName };
}

function resolveUserName(user: Record<string, unknown>): string {
  const displayName = String(user.display_name ?? "").trim();
  if (displayName) return displayName;

  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  if (fullName) return fullName;

  return String(user.email ?? FALLBACK_NAME);
}
