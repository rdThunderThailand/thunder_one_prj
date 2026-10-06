"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/lovable/dropdown-menu";
import { APP_LOCALES, applyAppLocale, type AppLocale } from "@/lib/app-locale";
import { cn } from "@/lib/utils";

const NAME: Record<AppLocale, string> = { th: "ภาษาไทย", en: "English" };

/**
 * The user's primary language for the whole app (lib/app-locale). Applies at once (`<html lang>`,
 * cookie), saves through `/api/me/language` to `users.preferred_language` when Core accepts it, then
 * refreshes server components so everything rendered on the server follows. Surfaces that read the
 * language today: the Help panel and the public Help Center. Other page copy is not translated yet:
 * there is no i18n catalogue in this repo.
 */
export function LanguageSwitch({ initialLocale, className }: { initialLocale: AppLocale; className?: string }) {
  const router = useRouter();
  const [locale, setLocale] = useState<AppLocale>(initialLocale);

  // The root layout renders from the cookie; with no cookie yet, the session's preferred_language
  // decides `initialLocale`, so bring <html lang> in line with it.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const choose = (next: AppLocale) => {
    if (next === locale) return;
    setLocale(next);
    void applyAppLocale(next).then(() => router.refresh());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={locale === "th" ? "เปลี่ยนภาษา" : "Change language"}
        className={cn("flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold uppercase", className)}
      >
        {locale}
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {APP_LOCALES.map((l) => (
          <DropdownMenuItem key={l} lang={l} onSelect={() => choose(l)} className="gap-2">
            <Globe aria-hidden="true" className="text-muted-foreground" />
            <span className="flex-1">{NAME[l]}</span>
            <span className="text-2xs font-bold uppercase text-muted-foreground">{l}</span>
            {l === locale && <Check aria-label="selected" className="text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
