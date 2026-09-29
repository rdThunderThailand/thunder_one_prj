import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TENANT_COOKIE } from "@/lib/core/tenant-selection";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("to_at");
  cookieStore.delete(TENANT_COOKIE);
  return NextResponse.json({ ok: true });
}
