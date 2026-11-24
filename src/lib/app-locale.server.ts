// Server only: next/headers cannot be imported from client components.
import { cookies } from "next/headers";
import { LOCALE_COOKIE, resolveAppLocale, type AppLocale } from "./app-locale";

/**
 * The app language for this request. Pass the signed-in user's `preferred_language` when the caller
 * has the session; public pages (the Help Center, login) go by the device cookie alone.
 */
export async function getAppLocale(userPreference?: string | null): Promise<AppLocale> {
  return resolveAppLocale({ device: (await cookies()).get(LOCALE_COOKIE)?.value, user: userPreference });
}
