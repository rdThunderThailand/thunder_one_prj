import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export const dynamic = "force-dynamic";

// The "brand-new invitee, no Core account yet" branch — chains
// register -> login -> accept server-side in one request, same 3 Core
// calls thundercore-prj-frontend-55's reference implementation makes (they
// chain them in a server action; this app doesn't use server actions for
// auth anywhere else, so a single API route does the same job, matching
// api/auth/login|set-password/route.ts's own shape). One request instead
// of three round trips from the client also means the client never holds
// an intermediate half-logged-in state.
//
// `invite_token` on the register call is load-bearing, not decorative —
// per Core's contract it's what lets a verified pending invite bypass the
// tenant's normal `allow_account_creation` gate; register would 403
// without it under a gated config.
export async function POST(request: Request) {
  const { token, email, password, firstName, lastName } = await request.json().catch(() => ({}));
  if (!token || !email || !password || !firstName || !lastName) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const coreHeaders = { "Content-Type": "application/json", "x-api-key": env.coreApiKey };

  try {
    const registerRes = await fetch(`${env.coreApiUrl}/api/core/v1/auth/register`, {
      method: "POST",
      headers: coreHeaders,
      body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName, invite_token: token }),
    });
    if (!registerRes.ok) {
      const body = await registerRes.json().catch(() => null);
      return NextResponse.json(
        { error: body?.message ?? body?.error ?? "Could not create your account." },
        { status: registerRes.status }
      );
    }

    const loginRes = await fetch(`${env.coreApiUrl}/api/core/v1/auth/login`, {
      method: "POST",
      headers: coreHeaders,
      body: JSON.stringify({ email, password }),
    });
    if (!loginRes.ok) {
      // Account was created but we couldn't establish a session — the
      // clean recovery path is the ordinary /login form, not a retry loop
      // here (register isn't idempotent-safe to call twice).
      return NextResponse.json(
        { error: "Your account was created, but signing you in failed. Please sign in manually." },
        { status: 502 }
      );
    }
    const loginBody = await loginRes.json();
    const authData = loginBody?.data;
    if (!authData?.access_token) {
      return NextResponse.json(
        { error: "Your account was created, but signing you in failed. Please sign in manually." },
        { status: 502 }
      );
    }

    // Set the real session cookie now — a genuine account + session exists
    // from here on regardless of whether the accept call below succeeds,
    // so the visitor should end up logged in either way rather than stuck
    // re-entering a password on a route that already worked.
    const cookieStore = await cookies();
    const cookieOptions: { httpOnly: boolean; sameSite: "lax"; path: string; secure: boolean; expires?: Date } = {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    };
    if (typeof authData.expires_at === "number") {
      cookieOptions.expires = new Date(authData.expires_at * 1000);
    }
    cookieStore.set("to_at", authData.access_token, cookieOptions);

    const acceptRes = await fetch(`${env.coreApiUrl}/api/core/v1/invites/accept`, {
      method: "POST",
      headers: { ...coreHeaders, Authorization: `Bearer ${authData.access_token}` },
      body: JSON.stringify({ token }),
    });
    if (!acceptRes.ok) {
      const body = await acceptRes.json().catch(() => null);
      // Logged in already (cookie is set) but not a tenant member yet —
      // the dashboard layout's existing "forbidden" -> /no-access handling
      // covers this state; surface the real reason here too.
      return NextResponse.json(
        {
          error: body?.message ?? body?.error ?? "Signed in, but could not accept the invitation.",
          signedIn: true,
        },
        { status: acceptRes.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not complete registration." }, { status: 500 });
  }
}
