"use client";

import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { unstable_catchError, type ErrorInfo } from "next/error";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, BookOpen, ChevronRight, ExternalLink, LifeBuoy, MessageCircle, Search, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { cn } from "@/lib/utils";
import { CONTENT_TYPE_LABEL, LOCALE_NAME, formatDate, t } from "../copy";
import { RETURN_STORAGE_KEY, guideHref, helpHref } from "../navigation";
import { browseGuides, deliverGuide, helpData, resolveContext, searchGuides, type GuideCard } from "../repository";
import { findScreenByKey, helpContextFromPathname } from "../screens";
import { CONTENT_TYPES, DEFAULT_LOCALE, LOCALES, type HelpContext, type Locale } from "../types";
import { GuideBody } from "./GuideBody";
import { ContentTypeIcon, LocaleOnlyTag } from "./GuideMeta";
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
    // Private mode or blocked storage: the choice just doesn't outlive this panel.
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

type Tab = "page" | "guides" | "support";
type Reading = { slug: string; locale: Locale } | null;

/**
 * HLP-004 — Contextual Help, as a panel dropped from the Topbar's ? (FigJam "Help Center",
 * Media Workspace Help Dashboard). Non-modal: the page behind stays visible and usable, and the panel
 * never creates, edits or publishes anything (D-G7-03, AC-012). Phones get a full-screen surface (AC-025).
 */
export function HelpDrawer({
  open,
  onOpenChange,
  pathname,
  supportUrl,
  triggerRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
  supportUrl?: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          // The ? button toggles; without this a click on it would close then immediately reopen.
          onInteractOutside={(e) => {
            if (triggerRef.current?.contains(e.target as Node)) e.preventDefault();
          }}
          className={cn(
            "fixed z-(--z-index-popover) flex flex-col overflow-hidden bg-card text-sm text-foreground outline-none",
            "inset-0 sm:inset-auto sm:right-4 sm:top-[4.75rem] sm:max-h-[calc(100dvh-5.75rem)] sm:w-[420px] sm:rounded-2xl sm:border sm:border-border sm:shadow-float",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2",
          )}
        >
          {open && <PanelBody pathname={pathname} supportUrl={supportUrl} onClose={() => onOpenChange(false)} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function PanelBody({ pathname, supportUrl, onClose }: { pathname: string; supportUrl?: string; onClose: () => void }) {
  const [locale, setLocaleState] = useState<Locale>(readLocale);
  const [tab, setTab] = useState<Tab>("page");
  const [reading, setReading] = useState<Reading>(null);
  const [query, setQuery] = useState("");

  const ctx = useMemo(() => helpContextFromPathname(pathname, locale), [pathname, locale]);
  const from = ctx.screenKey ?? null;

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    writeLocale(next);
    if (reading) setReading({ ...reading, locale: next });
  };
  const leave = () => {
    rememberReturn(ctx);
    onClose();
  };
  const openGuide = (card: GuideCard) => setReading({ slug: card.slug, locale: card.inRequestedLocale ? locale : card.shownLocale });
  const switchTab = (next: string) => {
    setTab(next as Tab);
    setReading(null);
    setQuery("");
  };

  return (
    <>
      <header className="px-5 pt-5">
        <div className="flex items-center gap-2">
          <DialogPrimitive.Title className="min-w-0 flex-1 text-2xl font-extrabold tracking-tight">{t("help", locale)}</DialogPrimitive.Title>
          <LocaleSwitch locale={locale} onChange={setLocale} />
          <DialogPrimitive.Close aria-label={t("close", locale)} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
            <X aria-hidden="true" className="h-5 w-5" />
          </DialogPrimitive.Close>
        </div>
      </header>

      <Tabs value={tab} onValueChange={switchTab} className="flex min-h-0 flex-1 flex-col">
        <div className="px-5 pt-4">
          <TabsList className="grid h-10 w-full grid-cols-3 rounded-xl border border-border bg-card p-1">
            {(["page", "guides", "support"] as const).map((value) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-full rounded-lg text-xs font-semibold text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
              >
                {t(value === "page" ? "tabThisPage" : value === "guides" ? "tabGuides" : "tabSupport", locale)}
              </TabsTrigger>
            ))}
          </TabsList>
          {!reading && tab !== "support" && (
            <label className="relative mt-3 block">
              <span className="sr-only">{t(tab === "guides" ? "searchGuides" : "searchHelp", locale)}</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(tab === "guides" ? "searchGuides" : "searchHelp", locale)}
                className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          )}
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto border-t border-border-subtle px-5 py-4">
          <PanelErrorBoundary locale={locale}>
            {reading ? (
              <GuideReader reading={reading} locale={locale} from={from} tab={tab} onBack={() => setReading(null)} onLeave={leave} onReadIn={setLocale} />
            ) : (
              <>
                <TabsContent value="page" className="mt-0">
                  {query.trim() ? <SearchResults query={query} locale={locale} onOpen={openGuide} /> : <ThisPage ctx={ctx} locale={locale} onOpen={openGuide} />}
                </TabsContent>
                <TabsContent value="guides" className="mt-0">
                  {query.trim() ? <SearchResults query={query} locale={locale} onOpen={openGuide} /> : <AllGuides locale={locale} onOpen={openGuide} />}
                </TabsContent>
                <TabsContent value="support" className="mt-0">
                  <SupportTab locale={locale} supportUrl={supportUrl} from={from} onOpen={openGuide} onLeave={leave} />
                </TabsContent>
              </>
            )}
          </PanelErrorBoundary>
        </div>
      </Tabs>

      <footer className={cn("grid gap-2 border-t border-border px-5 py-4", supportUrl ? "grid-cols-2" : "grid-cols-1")}>
        <Link href={helpHref("/", { lang: locale, from })} onClick={leave} className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-border bg-card px-3 text-xs font-semibold text-primary hover:bg-primary-soft">
          <BookOpen aria-hidden="true" className="h-4 w-4" />
          {t("openHelpCenter", locale)}
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
        {supportUrl && <SupportAnchor href={supportUrl} className="h-11 rounded-xl border border-border bg-card text-primary hover:bg-primary-soft" locale={locale} />}
      </footer>
    </>
  );
}

/**
 * Any failure inside Help stays inside the panel; the Workspace page behind it is untouched
 * (D-G6-04, AC-013). Help content is client-side here, so `reset` (re-render) is the recovery.
 */
const PanelErrorBoundary = unstable_catchError(function PanelError({ locale }: { locale: Locale }, { reset }: ErrorInfo) {
  return <HelpUnavailable locale={locale} onRetry={() => reset()} compact />;
});

// ---------------------------------------------------------------- This page

/** About this page · Common tasks · Troubleshooting — the spec's Primary + Related and Troubleshooting (D-G6-02, AC-002/003). */
function ThisPage({ ctx, locale, onOpen }: { ctx: HelpContext; locale: Locale; onOpen: (card: GuideCard) => void }) {
  const screen = findScreenByKey(ctx.screenKey);
  const result = resolveContext(helpData, ctx);
  const tasks = [...result.primary, ...result.related];

  return (
    <div className="space-y-6">
      <section>
        <SectionLabel>{t("aboutThisPage", locale)}</SectionLabel>
        <h3 className="mt-1 text-lg font-bold tracking-tight">{screen ? screen.label[locale] : t("helpGeneral", locale)}</h3>
        <p className="mt-1 text-[13px] leading-6 text-muted-foreground">{screen ? screen.about[locale] : t("generalAbout", locale)}</p>
      </section>

      {result.level === "none" ? (
        <PanelEmpty title={t("noHelpForPageTitle", locale)} text={t("noHelpForPageText", locale)} />
      ) : (
        <>
          {tasks.length > 0 && (
            <section>
              <SectionLabel>{t("commonTasks", locale)}</SectionLabel>
              <RowList cards={tasks} locale={locale} onOpen={onOpen} />
            </section>
          )}
          {result.troubleshooting.length > 0 && (
            <section>
              <SectionLabel>{t("troubleshooting", locale)}</SectionLabel>
              <RowList cards={result.troubleshooting} locale={locale} onOpen={onOpen} tone="trouble" />
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Guides

function AllGuides({ locale, onOpen }: { locale: Locale; onOpen: (card: GuideCard) => void }) {
  const all = browseGuides(helpData, locale);
  return (
    <div className="space-y-6">
      {CONTENT_TYPES.map((type) => {
        const cards = all.filter((c) => c.contentType === type);
        if (cards.length === 0) return null;
        return (
          <section key={type}>
            <SectionLabel>{CONTENT_TYPE_LABEL[type]}</SectionLabel>
            <RowList cards={cards} locale={locale} onOpen={onOpen} tone={type === "troubleshooting" ? "trouble" : "task"} />
          </section>
        );
      })}
    </div>
  );
}

function SearchResults({ query, locale, onOpen }: { query: string; locale: Locale; onOpen: (card: GuideCard) => void }) {
  const results = searchGuides(helpData, query, locale);
  if (results.length === 0) return <PanelEmpty title={t("noResultsTitle", locale)} text={t("noResultsText", locale, { q: query.trim() })} />;
  return (
    <section>
      <SectionLabel>{t("searchResults", locale)}</SectionLabel>
      <RowList cards={results} locale={locale} onOpen={onOpen} />
    </section>
  );
}

// ---------------------------------------------------------------- Support

/**
 * Escalation only (AC-024). Shows the configured Support destination and the troubleshooting Guides
 * people usually need first; channels that do not exist yet (chat, phone, status page) are not shown.
 */
function SupportTab({ locale, supportUrl, from, onOpen, onLeave }: { locale: Locale; supportUrl?: string; from: string | null; onOpen: (card: GuideCard) => void; onLeave: () => void }) {
  const topics = browseGuides(helpData, locale, { contentType: "troubleshooting" });
  return (
    <div className="space-y-6">
      <section>
        <SectionLabel>{t("contactSupport", locale)}</SectionLabel>
        <div className="mt-2 rounded-xl border border-border p-4">
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t("supportCardTitle", locale)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{t(supportUrl ? "supportCardText" : "supportNotConfigured", locale)}</p>
            </div>
          </div>
          {supportUrl && <SupportAnchor href={supportUrl} locale={locale} className="mt-3 h-9 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" />}
        </div>
      </section>
      {topics.length > 0 && (
        <section>
          <SectionLabel>{t("commonSupportTopics", locale)}</SectionLabel>
          <RowList cards={topics} locale={locale} onOpen={onOpen} tone="trouble" />
        </section>
      )}
      <section>
        <SectionLabel>{t("usefulLinks", locale)}</SectionLabel>
        <Link href={helpHref("/", { lang: locale, from })} onClick={onLeave} className="flex items-center gap-3 border-b border-border-subtle py-3 hover:text-primary">
          <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary">
            <BookOpen className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{t("helpCenter", locale)}</span>
            <span className="block text-xs text-muted-foreground">{t("helpCenterLinkText", locale)}</span>
          </span>
          <ExternalLink aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
        </Link>
      </section>
    </div>
  );
}

function SupportAnchor({ href, className, locale }: { href: string; className: string; locale: Locale }) {
  return (
    <a
      href={href}
      {...(/^https?:/i.test(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn("inline-flex items-center justify-center gap-2 whitespace-nowrap px-3 text-xs font-semibold", className)}
    >
      <LifeBuoy aria-hidden="true" className="h-4 w-4" />
      {t("contactSupport", locale)}
    </a>
  );
}

// ---------------------------------------------------------------- Reading a Guide in the panel

function GuideReader({ reading, locale, from, tab, onBack, onLeave, onReadIn }: {
  reading: NonNullable<Reading>;
  locale: Locale;
  from: string | null;
  tab: Tab;
  onBack: () => void;
  onLeave: () => void;
  onReadIn: (locale: Locale) => void;
}) {
  const d = deliverGuide(helpData, reading.slug, reading.locale);
  const backLabel = t(tab === "page" ? "backToThisPage" : tab === "guides" ? "backToGuides" : "backToSupport", locale);
  return (
    <div>
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
        <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        {backLabel}
      </button>
      {d.kind === "ok" ? (
        <article lang={d.locale}>
          <p className="text-2xs text-muted-foreground">
            {t("tabGuides", locale)} <span aria-hidden="true">›</span> {CONTENT_TYPE_LABEL[d.guide.contentType]}
          </p>
          {d.locale !== locale && (
            <div className="mt-2">
              <LocaleOnlyTag shown={d.locale} locale={locale} />
            </div>
          )}
          <h3 className="mt-1 text-xl font-bold leading-7 tracking-tight">{d.content.title}</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">{d.content.summary}</p>
          <p className="mt-1 text-2xs text-muted-foreground">{t("updated", locale, { date: formatDate(d.content.updatedAt, locale) })}</p>
          <div className="mt-4">
            <GuideBody body={d.content.body} dense />
          </div>
          <Link
            href={guideHref(reading.slug, { lang: d.locale, from })}
            onClick={onLeave}
            className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-primary hover:bg-primary-soft"
          >
            {t("openInHelpCenter", locale)}
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </article>
      ) : d.kind === "locale-unavailable" ? (
        <div role="status" className="rounded-xl border border-border p-4 text-center">
          <p className="font-semibold">{t("translationUnavailableTitle", locale, { lang: LOCALE_NAME[reading.locale][locale] })}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("translationUnavailableText", locale, { title: d.otherTitle, other: LOCALE_NAME[d.available[0]][locale] })}</p>
          <button type="button" onClick={() => onReadIn(d.available[0])} className="mt-3 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground">
            {t("readIn", locale, { lang: LOCALE_NAME[d.available[0]][locale] })}
          </button>
        </div>
      ) : (
        <PanelEmpty title={t("articleUnavailableTitle", locale)} text={t("articleUnavailableText", locale)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- building blocks

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="type-label text-muted-foreground">{children}</h3>;
}

/** List rows as in the reference: icon, title, one-line subtitle, chevron, hairline between rows. */
function RowList({ cards, locale, onOpen, tone = "task" }: { cards: GuideCard[]; locale: Locale; onOpen: (card: GuideCard) => void; tone?: "task" | "trouble" }) {
  return (
    <ul className="mt-1">
      {cards.map((card) => (
        <li key={card.guideId} className="border-b border-border-subtle last:border-b-0">
          <button type="button" onClick={() => onOpen(card)} className="group flex w-full items-center gap-3 py-2.5 text-left">
            {tone === "trouble" ? (
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-warning-soft text-warning">
                <AlertTriangle className="h-4 w-4" />
              </span>
            ) : (
              <ContentTypeIcon type={card.contentType} size="sm" className="h-8 w-8" />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold group-hover:text-primary" lang={card.shownLocale}>{card.title}</span>
              <span className="block truncate text-xs text-muted-foreground" lang={card.shownLocale}>{card.summary}</span>
            </span>
            {!card.inRequestedLocale && <LocaleOnlyTag shown={card.shownLocale} locale={locale} />}
            <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function PanelEmpty({ title, text }: { title: string; text: string }) {
  return (
    <div role="status" className="flex flex-col items-center px-4 py-10 text-center">
      <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Search className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

function LocaleSwitch({ locale, onChange }: { locale: Locale; onChange: (locale: Locale) => void }) {
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
