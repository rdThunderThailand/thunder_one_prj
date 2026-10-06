import Link from "next/link";
import { LifeBuoy, Search } from "lucide-react";
import { env } from "@/config/env";
import { cn } from "@/lib/utils";
import { LOCALE_NAME, t } from "../copy";
import { helpHref } from "../navigation";
import { LOCALES, type Locale } from "../types";
import { ExitButton } from "./ExitButton";

export interface ShellProps {
  locale: Locale;
  from: string | null;
  /** The same page in each locale, so switching language keeps the reader where they are (UC-007). */
  localeHrefs: Record<Locale, string>;
  /** Shows the compact search in the header (every page but Home, which has the large one). */
  headerSearch?: { query?: string };
  children: React.ReactNode;
}

/** Public Help Center frame (HLP-001/002/003/005–008). No session, no user menu: Help is Auth-independent (D-G7-01). */
export function HelpPageShell({ locale, from, localeHrefs, headerSearch, children }: ShellProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-sm text-foreground" lang={locale}>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href={helpHref("/", { lang: locale, from })} className="flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG, same as the auth shell */}
            <img src="/brand/t1-logo-horizontal.svg" alt="ThunderOne" className="h-7 w-auto" />
            <span aria-hidden="true" className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden text-sm font-semibold text-foreground sm:block">{t("helpCenter", locale)}</span>
          </Link>

          {headerSearch && (
            <form action={helpHref("/search")} role="search" className="ml-2 hidden min-w-0 max-w-md flex-1 md:block">
              <HiddenContext locale={locale} from={from} />
              <label className="relative block">
                <span className="sr-only">{t("searchLabel", locale)}</span>
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  name="q"
                  defaultValue={headerSearch.query}
                  placeholder={t("searchPlaceholder", locale)}
                  className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            </form>
          )}

          <div className="ml-auto flex items-center gap-2">
            <LocaleSwitch locale={locale} hrefs={localeHrefs} />
            <ExitButton from={from} locale={locale} className="hidden sm:inline-flex" />
          </div>
        </div>
      </header>

      {headerSearch && (
        <form action={helpHref("/search")} role="search" className="border-b border-border px-4 py-3 md:hidden">
          <HiddenContext locale={locale} from={from} />
          <label className="relative block">
            <span className="sr-only">{t("searchLabel", locale)}</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={headerSearch.query}
              placeholder={t("searchPlaceholder", locale)}
              className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </form>
      )}

      <main className="flex-1">{children}</main>

      <SupportBand locale={locale} />

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:px-6">
          <span>© ThunderOne</span>
          <ExitButton from={from} locale={locale} className="sm:hidden" />
        </div>
      </footer>
    </div>
  );
}

/** Keeps language and return context across a GET search form. */
export function HiddenContext({ locale, from }: { locale: Locale; from: string | null }) {
  return (
    <>
      <input type="hidden" name="lang" value={locale} />
      {from && <input type="hidden" name="from" value={from} />}
    </>
  );
}

export function LocaleSwitch({ locale, hrefs, className }: { locale: Locale; hrefs: Record<Locale, string>; className?: string }) {
  return (
    <nav aria-label={t("language", locale)} className={cn("flex h-9 items-center rounded-lg bg-muted p-1", className)}>
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={hrefs[l]}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          title={LOCALE_NAME[l][l]}
          className={cn(
            "grid h-7 min-w-9 place-items-center rounded-md px-2 text-xs font-bold uppercase transition-colors",
            l === locale ? "bg-card text-foreground shadow-panel" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </Link>
      ))}
    </nav>
  );
}

/** Escalation, shown only when a Support destination is configured (UC-008). Never a Content Type (AC-024). */
export function SupportBand({ locale }: { locale: Locale }) {
  if (!env.helpSupportUrl) return null;
  return (
    <section className="border-t border-border bg-surface-subtle">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-6 sm:px-6">
        <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t("stillNeedHelp", locale)}</p>
          <p className="text-xs text-muted-foreground">{t("stillNeedHelpText", locale)}</p>
        </div>
        <SupportLink locale={locale} />
      </div>
    </section>
  );
}

export function SupportLink({ locale, variant = "primary" }: { locale: Locale; variant?: "primary" | "outline" }) {
  if (!env.helpSupportUrl) return null;
  const external = /^https?:/i.test(env.helpSupportUrl);
  return (
    <a
      href={env.helpSupportUrl}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-xs font-semibold transition-colors",
        variant === "primary" ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      <LifeBuoy aria-hidden="true" className="h-3.5 w-3.5" />
      {t("contactSupport", locale)}
    </a>
  );
}
