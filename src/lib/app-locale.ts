// The shell's language — one choice for the whole app, owned by the shell (Topbar LanguageSwitch).
// Stored in a cookie so server components (the dashboard layout, the public Help Center) know it on
// the first render; reflected on `<html lang>` so anything that follows the shell (the Help panel,
// screen readers) reads it from one place. Core has no user-preference store yet, so this is per browser.

export const APP_LOCALES = ["th", "en"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];
export const DEFAULT_APP_LOCALE: AppLocale = "th";
export const LOCALE_COOKIE = "t1_lang";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function parseAppLocale(value: unknown): AppLocale | null {
  return typeof value === "string" && (APP_LOCALES as readonly string[]).includes(value) ? (value as AppLocale) : null;
}

/** Client only: remember the choice and apply it to the document right away. */
export function applyAppLocale(locale: AppLocale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
  document.documentElement.lang = locale;
}
