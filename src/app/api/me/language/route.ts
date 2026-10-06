import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import { coreAuthHeaders, coreGet } from "@/lib/core/core-get";
import { selectedTenantHeader } from "@/lib/core/tenant-selection";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, parseAppLocale, type SaveLanguageResult } from "@/lib/app-locale";

export const dynamic = "force-dynamic";

/**
 * Save the user's primary language (Topbar LanguageSwitch).
 *
 * Always sets the `t1_lang` cookie, then tries to write `public.users.preferred_language` through
 * Core's `PATCH /users/:id`. Core's `updateProfileSchema` does not accept that key yet (400
 * "unrecognized_keys", checked 2026-10-06), so `saved` is false today and the device cookie carries
 * the choice. Once Core accepts the key, `saved` turns true with no change here.
 */
export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  const locale = parseAppLocale(body?.locale);
  if (!locale) {
    return NextResponse.json({ error: "locale must be one of th, en" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: "lax" });

  const result: SaveLanguageResult = { locale, saved: false };
  const token = cookieStore.get("to_at")?.value;
  if (!token || !env.coreApiUrl) return NextResponse.json(result);

  const me = await coreGet<{ id?: unknown; preferred_language?: unknown }>("/me", token);
  if (typeof me?.id !== "string") return NextResponse.json(result);
  if (me.preferred_language === locale) return NextResponse.json({ ...result, saved: true });

  try {
    const res = await fetch(`${env.coreApiUrl}/api/core/v1/users/${encodeURIComponent(me.id)}`, {
      method: "PATCH",
      headers: { ...coreAuthHeaders(token), ...(await selectedTenantHeader()), "Content-Type": "application/json" },
      body: JSON.stringify({ preferred_language: locale }),
      cache: "no-store",
    });
    result.saved = res.ok;
  } catch {
    // Core unreachable: the cookie still holds the choice on this device.
  }
  return NextResponse.json(result);
}
