import { NextResponse } from "next/server";
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
    headersToSend["Authorization"] = `Bearer ${deviceToken}`;
  } else if (env.coreApiKey) {
    headersToSend["x-api-key"] = env.coreApiKey;
  }

  let body: string | undefined = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      const text = await request.text();
      if (text) {
        body = text;
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
