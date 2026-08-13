import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const upstreamRes = await fetch(`${env.coreApiUrl}/api/core/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.coreApiKey,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!upstreamRes.ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const resData = await upstreamRes.json();
    const authData = resData?.data;

    if (!authData?.access_token) {
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
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
    return NextResponse.json({ error: "Authentication error" }, { status: 401 });
  }
}
