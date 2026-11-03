import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import { selectedTenantHeader } from "@/lib/core/tenant-selection";
import { getSession } from "@/features/auth/services/get-session";

export const dynamic = "force-dynamic";

type RouteCtx = {
  params: Promise<{ path: string[] }>;
};

async function handle(request: Request, ctx: RouteCtx): Promise<NextResponse> {
  const { path } = await ctx.params;
  const joinedPath = path.join("/");
  const assetV2 = path[0] === "v2" && path[1] === "asset-workspace" && path[2] === "assets";
  const privateHeaders = { "Cache-Control": "private, no-store" };
  const reject = (status: number, error: string) => NextResponse.json({ error, uncertain: false }, { status, headers: privateHeaders });
  if (path[0] === "v2" && !assetV2) return reject(404, "This v2 proxy path is not available.");
  let upstreamPath = `v1/${joinedPath}`;

  if (assetV2) {
    if (path.some((part) => part === "." || part === ".." || /[\\/?#\u0000-\u001f]/.test(part))) return reject(400, "Invalid API path.");
    if (request.headers.has("x-device-token")) return reject(403, "A user session is required.");
    if (!(await cookies()).get("to_at")?.value) return reject(401, "Sign in again to continue.");
    let session;
    try { session = await getSession(); }
    catch { return reject(401, "Sign in again to continue."); }
    if (session === "forbidden" || !session.tenantId || !session.userId) return reject(403, "Choose an authorized organization.");
    const context = request.headers.get("x-registration-context");
    const registration = !["lookup", "list", "summary", "filters"].includes(path[3] ?? "");
    if ((registration || context) && context !== `${session.tenantId}:${session.userId}`) return reject(403, "Your account or organization changed. Return to the matching registration context.");
    if (!["GET", "HEAD"].includes(request.method) && request.headers.get("origin") !== new URL(request.url).origin) return reject(403, "Requests must originate from this application.");
    upstreamPath = `v2/tenants/${encodeURIComponent(session.tenantId)}/${path.slice(1).join("/")}`;
    if (!env.coreApiUrl || !env.coreApiKey) return reject(503, "The asset service is not configured.");
  }

  if (joinedPath === "__config") {
    return NextResponse.json({
      coreApiUrl: env.coreApiUrl,
      hasKey: Boolean(env.coreApiKey),
    });
  }

  if (!env.coreApiUrl) {
    return NextResponse.json(
      { error: "CORE_API_URL is not set" },
      { status: 500 }
    );
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = `${env.coreApiUrl}/api/core/${upstreamPath}${incomingUrl.search}`;

  const headersToSend: Record<string, string> = {};
  const deviceToken = request.headers.get("x-device-token");

  if (deviceToken) {
    // Player/device path — Bearer only, unchanged.
    headersToSend["Authorization"] = `Bearer ${deviceToken}`;
  } else {
    // App identity always goes; logged-in user token is added on top when present.
    if (env.coreApiKey) headersToSend["x-api-key"] = env.coreApiKey;
    const userToken = (await cookies()).get("to_at")?.value;
    if (userToken) headersToSend["Authorization"] = `Bearer ${userToken}`;
    Object.assign(headersToSend, await selectedTenantHeader());
  }

  // Read as bytes, not text — a `.text()`/UTF-8 round trip corrupts any
  // non-UTF-8 body (e.g. a multipart/form-data file upload's binary part),
  // silently mangling uploaded files.
  let body: ArrayBuffer | undefined = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const buf = await request.arrayBuffer();
      if (buf.byteLength > 0) {
        body = buf;
        headersToSend["Content-Type"] =
          request.headers.get("content-type") || "application/json";
      }
    } catch {
      if (assetV2) return reject(400, "The request body could not be read.");
      // Ignore body read errors
    }
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: request.method,
      headers: headersToSend,
      body,
      ...(assetV2 ? { cache: "no-store" as const, redirect: "error" as const, signal: AbortSignal.timeout(request.method === "GET" ? 15000 : 60000) } : {}),
    });

    const resText = await upstreamRes.text();
    return new NextResponse(resText, {
      status: upstreamRes.status,
      headers: { "Content-Type": "application/json", ...(assetV2 ? privateHeaders : {}) },
    });
  } catch (err) {
    if (assetV2) return NextResponse.json({ code: "UPSTREAM_FAILED", error: "The asset service could not be reached.", uncertain: !["GET", "HEAD"].includes(request.method) }, { status: 502, headers: privateHeaders });
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET(request: Request, ctx: RouteCtx) {
  return handle(request, ctx);
}

export async function POST(request: Request, ctx: RouteCtx) {
  return handle(request, ctx);
}

export async function PATCH(request: Request, ctx: RouteCtx) {
  return handle(request, ctx);
}

export async function PUT(request: Request, ctx: RouteCtx) {
  return handle(request, ctx);
}

export async function DELETE(request: Request, ctx: RouteCtx) {
  return handle(request, ctx);
}
