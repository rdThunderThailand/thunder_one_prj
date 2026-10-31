import { NextResponse } from "next/server";
import { getAuthToken, getSession } from "@/features/auth/services/get-session";
import { getRegistrationOptions } from "@/features/asset-workspace/services/asset-registration-api";
import { registrationOperationSchema } from "@/features/asset-workspace/services/asset-registration-write-contract";
import { forwardRegistrationOperation } from "@/features/asset-workspace/services/asset-registration-write-api";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
function failure(status: number, error: string) {
  return NextResponse.json({ success: false, code: status === 400 ? "VALIDATION" : "ACCESS_DENIED", error, uncertain: false }, { status, headers });
}
async function registrationContext(request: Request) {
  const token = await getAuthToken();
  if (!token) return { response: failure(401, "Sign in again to continue registration.") };
  try {
    const session = await getSession();
    if (session === "forbidden" || !session.tenantId || !session.userId) return { response: failure(403, "Choose an authorized organization.") };
    // Context headers are a stale-page guard, never an authority for identity or ownership.
    if (request.headers.get("x-registration-context") !== `${session.tenantId}:${session.userId}`) {
      return { response: failure(403, "Your account or organization changed. Return to the matching registration context.") };
    }
    return { context: { token, tenantId: session.tenantId } };
  } catch {
    return { response: failure(401, "Refresh your session before continuing registration.") };
  }
}
export async function GET(request: Request) {
  const access = await registrationContext(request);
  if (access.response) return access.response;
  const result = await getRegistrationOptions(access.context!);
  return result.ok ? NextResponse.json({ success: true, data: result.data }, { headers }) : failure(result.status, result.message);
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return failure(403, "Registration requests must originate from this application.");
  const access = await registrationContext(request);
  if (access.response) return access.response;
  const parsed = registrationOperationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure(400, "Invalid registration fields. Review the entered information.");
  const result = await forwardRegistrationOperation(access.context!, parsed.data);
  return NextResponse.json(result.body, { status: result.status, headers });
}
