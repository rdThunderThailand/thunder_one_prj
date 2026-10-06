"use client";

import Link from "next/link";
import { unstable_catchError, type ErrorInfo } from "next/error";
import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, ExternalLink, LifeBuoy, Search, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/lovable/sheet";
import { cn } from "@/lib/utils";
import { LOCALE_NAME, formatDate, t } from "../copy";
import { RETURN_STORAGE_KEY, guideHref, helpHref } from "../navigation";
import { deliverGuide, helpData, resolveContext, searchGuides, type GuideCard } from "../repository";
import { findScreenByKey, helpContextFromPathname } from "../screens";
import { DEFAULT_LOCALE, LOCALES, type HelpContext, type Locale } from "../types";
import { GuideBody } from "./GuideBody";
import { ContentTypeIcon, GuideTags } from "./GuideMeta";
import { HelpUnavailable } from "./HelpStates";

const LOCALE_KEY = "t1.help.locale";

function readLocale(): Locale {
  try {
    const v = window.localStorage.getItem(LOCALE_KEY);
    return v === "th" || v === "en" ? v : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function writeLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // Private mode or blocked storage: the choice just doesn't outlive this drawer.
  }
}

/** Remembers the exact page Help was opened from, in this tab only, so the Help Center can return to it (UC-006). */
function rememberReturn(ctx: HelpContext) {
  try {
    const path = `${window.location.pathname}${window.location.search}`;
    window.sessionStorage.setItem(RETURN_STORAGE_KEY, JSON.stringify({ path, screenKey: ctx.screenKey }));
  } catch {
    // Without storage the Help Center falls back to the screen's list route.
  }
}

type View = { kind: "topics" } | { kind: "guide"; slug: string; locale: Locale };

/**
 * HLP-004 — Contextual Help Drawer. Read-only: it shows guidance and never creates, edits or
 * publishes anything (D-G7-03, AC-012). Desktop: right-side drawer; tablet: overlay; mobile:
 * full-screen surface (G5 baseline, AC-025).
 */
export function HelpDrawer({
  open,
  onOpenChange,
  pathname,
  supportUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
  supportUrl?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full flex-col gap-0 border-border bg-card p-0 sm:max-w-[420px] [&>button]:hidden"
        aria-describedby={undefined}
      >
        {/* Mounted only while open, so every open resolves the current page afresh. */}
        {open && <DrawerBody pathname={pathname} supportUrl={supportUrl} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({ pathname, supportUrl, onClose }: { pathname: string; supportUrl?: string; onClose: () => void }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);
  const [view, setView] = useState<View>({ kind: "topics" });
  const [query, setQuery] = useState("");

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    writeLocale(next);
    if (view.kind === "guide") setView({ ...view, locale: next });
  };

  const ctx = useMemo(() => helpContextFromPathname(pathname, locale), [pathname, locale]);
  const screen = findScreenByKey(ctx.screenKey);
  const from = ctx.screenKey ?? null;

  const leaveForHelpCenter = () => {
    rememberReturn(ctx);
    onClose();
  };

  return (
    <>
      <header className="border-b border-border px-5 pb-4 pt-5">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <BookOpen className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-base font-bold leading-6">{t("help", locale)}</SheetTitle>
            <SheetDescription className="truncate text-xs text-muted-foreground">
              {screen ? `${t("helpForThisPage", locale)} · ${screen.label[locale]}` : t("helpGeneral", locale)}
            </SheetDescription>
          </div>
          <DrawerLocaleSwitch locale={locale} onChange={setLocale} />
          <button type="button" onClick={onClose} aria-label={t("close", locale)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
        {view.kind === "topics" && (
          <label className="relative mt-4 block">
            <span className="sr-only">{t("searchHelp", locale)}</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchHelp", locale)}
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <DrawerErrorBoundary locale={locale}>
          <DrawerContent
            locale={locale}
            ctx={ctx}
            query={query}
            view={view}
            from={from}
            onOpenGuide={(card) => setView({ kind: "guide", slug: card.slug, locale: card.inRequestedLocale ? locale : card.shownLocale })}
            onBack={() => setView({ kind: "topics" })}
            onLeave={leaveForHelpCenter}
            onReadIn={setLocale}
          />
        </DrawerErrorBoundary>
      </div>

      <footer className="grid grid-cols-2 gap-2 border-t border-border px-5 py-4">
        <Link
          href={helpHref("/", { lang: locale, from })}
          onClick={leaveForHelpCenter}
          className={cn("inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:bg-muted", !supportUrl && "col-span-2")}
        >
          <BookOpen aria-hidden="true" className="h-3.5 w-3.5" />
          {t("openHelpCenter", locale)}
        </Link>
        {supportUrl && (
          <a
            href={supportUrl}
            {...(/^https?:/i.test(supportUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:bg-muted"
          >
            <LifeBuoy aria-hidden="true" className="h-3.5 w-3.5" />
            {t("contactSupport", locale)}
          </a>
        )}
      </footer>
    </>
  );
}

interface ContentProps {
  locale: Locale;
  ctx: HelpContext;
  query: string;
  view: View;
  from: string | null;
  onOpenGuide: (card: GuideCard) => void;
  onBack: () => void;
  onLeave: () => void;
  onReadIn: (locale: Locale) => void;
}

/**
 * Any failure inside Help stays inside the drawer; the Workspace page behind it is untouched
 * (D-G6-04, AC-013). Help content is client-side here, so `reset` (re-render) is the recovery.
 */
const DrawerErrorBoundary = unstable_catchError(function DrawerError({ locale }: { locale: Locale }, { reset }: ErrorInfo) {
  return <HelpUnavailable locale={locale} onRetry={() => reset()} compact />;
});

function DrawerContent(props: ContentProps) {
  const { locale, ctx, query, view, from, onOpenGuide, onBack, onLeave, onReadIn } = props;

  if (view.kind === "guide") {
    const d = deliverGuide(helpData, view.slug, view.locale);
    return (
      <div>
        <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          {t("backToTopics", locale)}
        </button>
        {d.kind === "ok" ? (
          <article lang={d.locale}>
            {d.locale !== locale && (
              <p className="mb-3 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                {t("onlyIn", locale, { lang: LOCALE_NAME[d.locale][locale] })}
              </p>
            )}
            <div className="flex items-start gap-3">
              <ContentTypeIcon type={d.guide.contentType} size="sm" />
              <div className="min-w-0">
                <h3 className="text-lg font-bold leading-7 tracking-tight">{d.content.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{d.content.summary}</p>
                <p className="mt-1 text-2xs text-muted-foreground">{t("updated", locale, { date: formatDate(d.content.updatedAt, locale) })}</p>
              </div>
            </div>
            <div className="mt-5">
              <GuideBody body={d.content.body} dense />
            </div>
            <Link
              href={guideHref(view.slug, { lang: d.locale, from })}
              onClick={onLeave}
              className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t("openInHelpCenter", locale)}
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </article>
        ) : d.kind === "locale-unavailable" ? (
          <div role="status" className="rounded-xl border border-border p-4 text-center">
            <p className="font-semibold">{t("translationUnavailableTitle", locale, { lang: LOCALE_NAME[view.locale][locale] })}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("translationUnavailableText", locale, { title: d.otherTitle, other: LOCALE_NAME[d.available[0]][locale] })}</p>
            <button type="button" onClick={() => onReadIn(d.available[0])} className="mt-3 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground">
              {t("readIn", locale, { lang: LOCALE_NAME[d.available[0]][locale] })}
            </button>
          </div>
        ) : (
          <DrawerEmpty title={t("articleUnavailableTitle", locale)} text={t("articleUnavailableText", locale)} />
        )}
      </div>
    );
  }

  if (query.trim()) {
    const results = searchGuides(helpData, query, locale);
    if (results.length === 0) {
      return (
        <DrawerEmpty title={t("noResultsTitle", locale)} text={t("noResultsText", locale, { q: query.trim() })}>
          <Link href={helpHref("/browse", { lang: locale, from })} onClick={onLeave} className="text-xs font-semibold text-primary hover:underline">
            {t("browseGuides", locale)}
          </Link>
        </DrawerEmpty>
      );
    }
    return (
      <DrawerSection title={t("searchResults", locale)}>
        <DrawerCards cards={results} locale={locale} onOpen={onOpenGuide} />
      </DrawerSection>
    );
  }

  const result = resolveContext(helpData, ctx);
  if (result.level === "none") {
    return <DrawerEmpty title={t("noHelpForPageTitle", locale)} text={t("noHelpForPageText", locale)} />;
  }
  return (
    <div className="space-y-6">
      <DrawerSection title={result.level === "general" ? t("helpGeneral", locale) : t("forThisPage", locale)}>
        <DrawerCards cards={result.primary} locale={locale} onOpen={onOpenGuide} emphasis />
      </DrawerSection>
      {result.related.length > 0 && (
        <DrawerSection title={t("related", locale)}>
          <DrawerCards cards={result.related} locale={locale} onOpen={onOpenGuide} />
        </DrawerSection>
      )}
      {result.troubleshooting.length > 0 && (
        <DrawerSection title={t("troubleshooting", locale)}>
          <DrawerCards cards={result.troubleshooting} locale={locale} onOpen={onOpenGuide} />
        </DrawerSection>
      )}
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="type-label mb-2 text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function DrawerCards({ cards, locale, onOpen, emphasis = false }: { cards: GuideCard[]; locale: Locale; onOpen: (card: GuideCard) => void; emphasis?: boolean }) {
  return (
    <ul className="grid gap-2">
      {cards.map((card) => (
        <li key={card.guideId}>
          <button
            type="button"
            onClick={() => onOpen(card)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40",
              emphasis ? "border-primary/25 bg-primary-soft/30" : "border-border bg-card",
            )}
          >
            <ContentTypeIcon type={card.contentType} size="sm" />
            <span className="min-w-0 flex-1">
              <GuideTags card={card} locale={locale} showWorkspace={false} />
              <span className="mt-1 block text-sm font-semibold" lang={card.shownLocale}>{card.title}</span>
              <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground" lang={card.shownLocale}>{card.summary}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function DrawerEmpty({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center px-4 py-10 text-center">
      <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Search className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

function DrawerLocaleSwitch({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
  return (
    <div role="group" aria-label={t("language", locale)} className="flex h-8 shrink-0 items-center rounded-lg bg-muted p-0.5">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === locale}
          title={LOCALE_NAME[l][l]}
          onClick={() => onChange(l)}
          className={cn("h-7 min-w-8 rounded-md px-2 text-2xs font-bold uppercase", l === locale ? "bg-card text-foreground shadow-panel" : "text-muted-foreground hover:text-foreground")}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
