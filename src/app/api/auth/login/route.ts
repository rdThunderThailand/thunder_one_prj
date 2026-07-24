import { NextResponse } from "next/server";
import { env } from "@/config/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { email, password } = body;

  if (typeof email !== "string" || !email || typeof password !== "string" || !password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 }
    );
  }

  if (!env.coreApiUrl) {
    return NextResponse.json(
      { error: "CORE_API_URL is not set" },
      { status: 500 }
    );
  }

  if (!env.coreApiKey) {
    return NextResponse.json(
      { error: "CORE_API_KEY is not set" },
      { status: 500 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${env.coreApiUrl}/api/core/v1/auth/login`, {
      method: "POST",
      headers: {
        "x-api-key": env.coreApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const json = await upstream.json().catch(() => ({}));

  if (!upstream.ok || !json?.data?.access_token) {
    return NextResponse.json(
      { error: json?.error ?? "Login failed" },
      { status: upstream.status || 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  const nowSec = Math.floor(Date.now() / 1000);
  const expiresAt = json.data.expires_at;
  const atMaxAge =
    typeof expiresAt === "number"
      ? Math.max(60, expiresAt - nowSec)
      : 3600;
  const rtMaxAge = 60 * 60 * 24 * 30;

  res.cookies.set("to_at", json.data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: atMaxAge,
  });

  res.cookies.set("to_rt", json.data.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure,
    maxAge: rtMaxAge,
  });

  return res;
}
