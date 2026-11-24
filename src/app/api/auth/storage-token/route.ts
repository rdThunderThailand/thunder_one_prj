import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/** Hands the logged-in user's Supabase access token to the browser for one purpose:
 *  resumable (TUS) uploads talk to Storage directly and this Storage version ignores
 *  presigned upload tokens, so the transfer has to carry a real user credential.
 *  What that credential may write is pinned by the "media tenant scoped upload" RLS
 *  policy, which only allows `videos/{the caller's own tenant_code}/…`. Every other
 *  request keeps using the httpOnly cookie through /api/proxy. */
export async function GET() {
  const token = (await cookies()).get("to_at")?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json(
    { access_token: token },
    { headers: { "Cache-Control": "no-store" } }
  );
}
