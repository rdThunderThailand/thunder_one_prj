import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export const dynamic = "force-dynamic";

// Server-side proxy to Core's POST /api/core/v1/auth/set-password — same
// shape as api/auth/login/route.ts (Core's response carries the same
// access_token/refresh_token/expires_at/user_id fields /auth/login
// returns, by design, so the cookie-setting code below is copied verbatim
// rather than shared, matching that file's own structure). Confirmed with
// Core (thunder-core-api-93, 2026-09-01): the caller isn't authenticated
// yet (that's the whole point — this IS how they authenticate for the
// first time), so this route needs no Bearer token itself, only the
// service-level x-api-key.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { access_token: inviteAccessToken, password } = body;

    const upstreamRes = await fetch(`${env.coreApiUrl}/api/core/v1/auth/set-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.coreApiKey,
      },
      body: JSON.stringify({ access_token: inviteAccessToken, password }),
    });

    if (!upstreamRes.ok) {
      // Core 401s a reused/expired invite token — this is the expected
      // "link no longer valid" case, not a transport failure.
      return NextResponse.json({ error: "This link has expired or was already used." }, { status: 401 });
    }

    const resData = await upstreamRes.json();
    const authData = resData?.data;

    if (!authData?.access_token) {
      return NextResponse.json({ error: "Could not set your password." }, { status: 401 });
    }

    const cookieStore = await cookies();
    const cookieOptions: {
      httpOnly: boolean;
      sameSite: "lax";
      path: string;
      secure: boolean;
      expires?: Date;
    } = {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    };

    if (authData.expires_at && typeof authData.expires_at === "number") {
      cookieOptions.expires = new Date(authData.expires_at * 1000);
    }

    cookieStore.set("to_at", authData.access_token, cookieOptions);

    return NextResponse.json({ userId: authData.user_id });
  } catch {
    return NextResponse.json({ error: "Could not set your password." }, { status: 401 });
  }
}
