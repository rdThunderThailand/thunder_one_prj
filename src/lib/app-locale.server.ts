// Server only: next/headers cannot be imported from client components.
import { cookies } from "next/headers";
import { DEFAULT_APP_LOCALE, LOCALE_COOKIE, parseAppLocale, type AppLocale } from "./app-locale";

/** The shell language for this request (cookie), or the default. */
export async function getAppLocale(): Promise<AppLocale> {
  return parseAppLocale((await cookies()).get(LOCALE_COOKIE)?.value) ?? DEFAULT_APP_LOCALE;
}
