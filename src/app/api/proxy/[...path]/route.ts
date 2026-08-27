import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";

export const dynamic = "force-dynamic";

type RouteCtx = {
  params: Promise<{ path: string[] }>;
};

async function handle(request: Request, ctx: RouteCtx): Promise<NextResponse> {
  const { path } = await ctx.params;
  const joinedPath = path.join("/");

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
  const targetUrl = `${env.coreApiUrl}/api/core/v1/${joinedPath}${incomingUrl.search}`;

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
      // Ignore body read errors
    }
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: request.method,
      headers: headersToSend,
      body,
    });

    const resText = await upstreamRes.text();
    return new NextResponse(resText, {
      status: upstreamRes.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
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
