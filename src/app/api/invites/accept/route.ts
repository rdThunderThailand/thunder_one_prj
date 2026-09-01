import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export const dynamic = "force-dynamic";

// For an already-logged-in visitor accepting an invite that matches their
// own email — the "no registration needed" branch of the 3-way split
// AcceptInviteForm/the page component decides between. Requires the
// caller's own `to_at` session (Core rejects an email mismatch itself, so
// this route doesn't re-check it — Core is the source of truth here, same
// "don't duplicate a check the server already enforces" discipline as
// every other Core-backed route in this app).
export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("to_at")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { token: inviteToken } = await request.json();

    const upstreamRes = await fetch(`${env.coreApiUrl}/api/core/v1/invites/accept`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.coreApiKey,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token: inviteToken }),
    });

    if (!upstreamRes.ok) {
      const body = await upstreamRes.json().catch(() => null);
      return NextResponse.json(
        { error: body?.message ?? body?.error ?? "Could not accept this invitation." },
        { status: upstreamRes.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not accept this invitation." }, { status: 500 });
  }
}
