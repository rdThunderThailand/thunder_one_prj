// The user's primary language for the whole app, owned by the shell (Topbar LanguageSwitch).
//
// Source of truth is Core's `public.users.preferred_language`, stored as a BCP 47 tag like
// `tenants.locale` ("th-TH", "en-US"; decided 2026-10-06 — older rows hold "th"). Core reads it today (`/session`,
// `/me`) but `PATCH /users/:id` does not accept it yet (strict schema → 400, checked 2026-10-06), so:
// - the switch writes the `t1_lang` cookie (this device) and *tries* Core; the moment Core accepts
//   the field the choice is saved to the account with no change here (`/api/me/language`);
// - login seeds the cookie from `preferred_language`, so a new device or a new login starts in the
//   user's language;
// - `<html lang>` carries the current language so anything that follows the shell (the Help panel,
//   screen readers) reads it from one place.

export const APP_LOCALES = ["th", "en"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];
export const DEFAULT_APP_LOCALE: AppLocale = "th";
export const LOCALE_COOKIE = "t1_lang";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** How each app locale is stored in `users.preferred_language` (same form as `tenants.locale`). */
export const LANGUAGE_TAG: Record<AppLocale, string> = { th: "th-TH", en: "en-US" };

export function parseAppLocale(value: unknown): AppLocale | null {
  return typeof value === "string" && (APP_LOCALES as readonly string[]).includes(value) ? (value as AppLocale) : null;
}

/**
 * A language value from the database (`users.preferred_language` "th", `tenants.locale` "th-TH",
 * "en_US", "EN") → an app locale, or null when it names a language the app does not offer.
 */
export function languageFromTag(value: unknown): AppLocale | null {
  if (typeof value !== "string") return null;
  const primary = value.trim().toLowerCase().split(/[-_]/)[0];
  return parseAppLocale(primary);
}

/**
 * Which language to render in. The device's latest choice wins while Core cannot store it, then
 * the user's saved preference, then the tenant's locale, then Thai (`th-TH`).
 */
export function resolveAppLocale(sources: { device?: unknown; user?: unknown; tenant?: unknown }): AppLocale {
  return (
    parseAppLocale(sources.device) ??
    languageFromTag(sources.user) ??
    languageFromTag(sources.tenant) ??
    DEFAULT_APP_LOCALE
  );
}

/** The result of `PUT /api/me/language`. `saved` is false while Core has no write path for it. */
export interface SaveLanguageResult {
  locale: AppLocale;
  saved: boolean;
}

/** Client only: apply the choice right away, then save it (cookie on the server, account on Core). */
export async function applyAppLocale(locale: AppLocale): Promise<SaveLanguageResult> {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
  document.documentElement.lang = locale;
  try {
    const res = await fetch("/api/me/language", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    if (!res.ok) return { locale, saved: false };
    const body = (await res.json().catch(() => null)) as Partial<SaveLanguageResult> | null;
    return { locale, saved: body?.saved === true };
  } catch {
    return { locale, saved: false };
  }
}
