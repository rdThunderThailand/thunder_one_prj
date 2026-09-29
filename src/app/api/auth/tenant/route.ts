import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import { getSession } from "@/features/auth/services/get-session";
import { TENANT_COOKIE, isTenantId } from "@/lib/core/tenant-selection";

export const dynamic = "force-dynamic";

/** Switches the tenant (Sidebar's tenant switcher). Platform super admins
 *  only, same as the menu itself. Asks Core's /session with the chosen
 *  `x-tenant-id` first, so the cookie is only set for a tenant Core actually
 *  lets this user enter. */
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("to_at")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = await getSession();
  if (session === "forbidden" || !session.isSuperAdmin) {
    return NextResponse.json({ error: "Only a platform super admin can switch tenants" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const tenantId = body?.tenantId;
  if (!isTenantId(tenantId)) {
    return NextResponse.json({ error: "Invalid tenant id" }, { status: 400 });
  }

  const res = await fetch(`${env.coreApiUrl}/api/core/v1/session`, {
    headers: { "x-api-key": env.coreApiKey, Authorization: `Bearer ${token}`, "x-tenant-id": tenantId },
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) {
    return NextResponse.json({ error: "Tenant not available" }, { status: res?.status === 401 ? 401 : 403 });
  }

  cookieStore.set(TENANT_COOKIE, tenantId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return NextResponse.json({ ok: true });
}

/** Drops a tenant choice Core no longer accepts (getSession redirects here on
 *  a 403 while the cookie is set), then starts over from "/". */
export async function GET(request: Request) {
  (await cookies()).delete(TENANT_COOKIE);
  return NextResponse.redirect(new URL("/", request.url));
}
