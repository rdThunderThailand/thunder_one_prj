"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_APP_LOCALE, languageFromTag, type AppLocale } from "@/lib/app-locale";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  return () => observer.disconnect();
}

const readLocale = (): AppLocale => languageFromTag(document.documentElement.lang) ?? DEFAULT_APP_LOCALE;

/** The shell's language (`<html lang>`, see lib/app-locale). It follows a language switch without a reload. */
export function useAppLocale(): AppLocale {
  return useSyncExternalStore(subscribe, readLocale, () => DEFAULT_APP_LOCALE);
}
