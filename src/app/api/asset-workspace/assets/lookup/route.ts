import { NextResponse } from "next/server";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { lookupAsset } from "@/features/asset-workspace/services/asset-lookup-api";
import { lookupFailure, lookupQuerySchema } from "@/features/asset-workspace/services/asset-lookup-contract";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ error: lookupFailure(401).message }, { status: 401, headers });
  let session;
  try { session = await getSession(); }
  catch { return NextResponse.json({ error: lookupFailure(401).message }, { status: 401, headers }); }
  if (session === "forbidden" || !session.tenantId) {
    return NextResponse.json({ error: lookupFailure(403).message }, { status: 403, headers });
  }
  const params = new URL(request.url).searchParams;
  const repeated = [...params.keys()].some((key) => params.getAll(key).length !== 1);
  const parsed = lookupQuerySchema.safeParse(Object.fromEntries(params));
  if (repeated || !parsed.success) {
    return NextResponse.json({ error: lookupFailure(400).message }, { status: 400, headers });
  }
  // Tenant identity comes from the server session, never from the scanned text or caller.
  const result = await lookupAsset({ token, tenantId: session.tenantId }, parsed.data, request.signal);
  return result.kind === "found"
    ? NextResponse.json({ success: true, data: result.data }, { headers })
    : NextResponse.json({ error: result.message }, { status: result.status, headers });
}
