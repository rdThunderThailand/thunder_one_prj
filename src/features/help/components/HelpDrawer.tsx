"use client";

import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { unstable_catchError, type ErrorInfo } from "next/error";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock,
  ExternalLink,
  Mail,
  MessageCircle,
  MessagesSquare,
  Phone,
  Search,
  Activity,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { cn } from "@/lib/utils";
import { CONTENT_TYPE_LABEL, LOCALE_NAME, formatDate, t } from "../copy";
import { RETURN_STORAGE_KEY, guideHref, helpHref } from "../navigation";
import { browseGuides, deliverGuide, helpData, resolveContext, searchGuides, type GuideCard, type GuideDelivery } from "../repository";
import { findScreenByKey, helpContextFromPathname } from "../screens";
import type { HelpSupportConfig } from "../support";
import { CONTENT_TYPES, DEFAULT_LOCALE, type GuideBlock, type HelpContext, type Locale } from "../types";
import { GuideBody } from "./GuideBody";
import { LocaleOnlyTag } from "./GuideMeta";
import { HelpUnavailable } from "./HelpStates";
import { guideIcon, troubleIcon } from "./guide-icons";

// ---------------------------------------------------------------- shell language

/**
 * The panel speaks the shell's language (`<html lang>`), it has no switch of its own. When the shell
 * gets a language switch that updates `lang`, the panel follows without a reload.
 */
function readShellLocale(): Locale {
  const lang = document.documentElement.lang.toLowerCase();
  return lang.startsWith("en") ? "en" : lang.startsWith("th") ? "th" : DEFAULT_LOCALE;
}

function subscribeShellLocale(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  return () => observer.disconnect();
}

function useShellLocale(): Locale {
  return useSyncExternalStore(subscribeShellLocale, readShellLocale, () => DEFAULT_LOCALE);
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
type Reading = { slug: string; locale: Locale; step: number } | null;

/**
 * HLP-004 — Contextual Help, as the panel dropped from the Topbar's ? (FigJam "Help Center", Media
 * Help Dashboard). Non-modal: the page behind stays visible and usable, and the panel never creates,
 * edits or publishes anything (D-G7-03, AC-012). Phones get a full-screen surface (AC-025).
 */
export function HelpDrawer({
  open,
  onOpenChange,
  pathname,
  support,
  triggerRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
  support?: HelpSupportConfig;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          // Non-modal dropdown: focus stays on the ? button that opened it (Esc and Tab still reach the panel).
          onOpenAutoFocus={(e) => e.preventDefault()}
          // The ? button toggles; without this a click on it would close then immediately reopen.
          onInteractOutside={(e) => {
            if (triggerRef.current?.contains(e.target as Node)) e.preventDefault();
          }}
          className={cn(
            "fixed z-(--z-index-popover) flex flex-col overflow-hidden bg-card text-sm text-foreground outline-none",
            "inset-0 sm:inset-auto sm:right-4 sm:top-[4.75rem] sm:h-[calc(100dvh-5.75rem)] sm:max-h-[860px] sm:w-[420px] sm:rounded-2xl sm:border sm:border-border sm:shadow-float",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2",
          )}
        >
          {open && <PanelBody pathname={pathname} support={support} onClose={() => onOpenChange(false)} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function PanelBody({ pathname, support, onClose }: { pathname: string; support?: HelpSupportConfig; onClose: () => void }) {
  const locale = useShellLocale();
  const [tab, setTab] = useState<Tab>("page");
  const [reading, setReading] = useState<Reading>(null);
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const ctx = useMemo(() => helpContextFromPathname(pathname, locale), [pathname, locale]);
  const from = ctx.screenKey ?? null;

  const leave = () => {
    rememberReturn(ctx);
    onClose();
  };
  const scrollTop = () => scrollRef.current?.scrollTo({ top: 0 });
  const openGuide = (card: GuideCard) => {
    setReading({ slug: card.slug, locale: card.inRequestedLocale ? locale : card.shownLocale, step: 0 });
    scrollTop();
  };
  const switchTab = (next: string) => {
    setTab(next as Tab);
    setReading(null);
    setQuery("");
    scrollTop();
  };

  const delivery = reading ? deliverGuide(helpData, reading.slug, reading.locale) : null;
  const steps = delivery?.kind === "ok" ? stepsOf(delivery.content.body) : [];
  const goStep = (step: number) => {
    if (!reading) return;
    setReading({ ...reading, step });
    // Bring the step into view inside the panel's own scroll area.
    requestAnimationFrame(() => scrollRef.current?.querySelector(`[data-step="${step}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  };

  const searchPlaceholder = t(tab === "guides" ? "searchGuides" : "searchHelpArticles", locale);

  return (
    <>
      <header className="flex items-center gap-2 px-5 pt-5">
        <DialogPrimitive.Title className="min-w-0 flex-1 text-2xl font-extrabold tracking-tight">{t("help", locale)}</DialogPrimitive.Title>
        <DialogPrimitive.Close aria-label={t("close", locale)} className="grid h-9 w-9 place-items-center rounded-lg text-foreground hover:bg-muted">
          <X aria-hidden="true" className="h-5 w-5" />
        </DialogPrimitive.Close>
      </header>

      <Tabs value={tab} onValueChange={switchTab} className="flex min-h-0 flex-1 flex-col">
        <div className="px-5 pt-4">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1.5 rounded-none bg-transparent p-0">
            {(["page", "guides", "support"] as const).map((value) => (
              <TabsTrigger
                key={value}
                value={value}
                className="h-10 rounded-lg border border-border bg-card text-sm font-semibold text-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
              >
                {t(value === "page" ? "tabThisPage" : value === "guides" ? "tabGuides" : "tabSupport", locale)}
              </TabsTrigger>
            ))}
          </TabsList>
          {tab !== "support" && (
            <label className="relative mt-3 block">
              <span className="sr-only">{searchPlaceholder}</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setReading(null);
                }}
                placeholder={searchPlaceholder}
                className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          )}
        </div>

        <div ref={scrollRef} className="mt-4 min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <PanelErrorBoundary locale={locale}>
            {reading && delivery ? (
              <GuideReader delivery={delivery} reading={reading} locale={locale} from={from} onLeave={leave} />
            ) : (
              <>
                <TabsContent value="page" className="mt-0">
                  {query.trim() ? <SearchResults query={query} locale={locale} onOpen={openGuide} /> : <ThisPage ctx={ctx} locale={locale} onOpen={openGuide} />}
                </TabsContent>
                <TabsContent value="guides" className="mt-0">
                  {query.trim() ? <SearchResults query={query} locale={locale} onOpen={openGuide} /> : <AllGuides locale={locale} onOpen={openGuide} />}
                </TabsContent>
                <TabsContent value="support" className="mt-0">
                  <SupportTab locale={locale} support={support} from={from} onOpen={openGuide} onLeave={leave} />
                </TabsContent>
              </>
            )}
          </PanelErrorBoundary>
        </div>
      </Tabs>

      {reading ? (
        <ReaderFooter
          locale={locale}
          step={reading.step}
          stepCount={steps.length}
          onBack={() => (reading.step > 0 ? goStep(reading.step - 1) : (setReading(null), scrollTop()))}
          onNext={() => (reading.step < steps.length - 1 ? goStep(reading.step + 1) : (setReading(null), scrollTop()))}
        />
      ) : tab === "page" ? (
        <footer className="grid grid-cols-2 gap-3 px-5 pb-5 pt-2">
          <Link href={helpHref("/", { lang: locale, from })} onClick={leave} className="inline-flex h-16 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-border bg-card px-3 text-sm font-semibold text-primary shadow-panel hover:bg-primary-soft">
            <BookOpen aria-hidden="true" className="h-5 w-5" />
            {t("openHelpCenter", locale)}
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </Link>
          <button type="button" onClick={() => switchTab("support")} className="inline-flex h-16 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-border bg-card px-3 text-sm font-semibold text-primary shadow-panel hover:bg-primary-soft">
            <MessageCircle aria-hidden="true" className="h-5 w-5" />
            {t("contactSupport", locale)}
          </button>
        </footer>
      ) : null}
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
        <h3 className="mt-1.5 text-lg font-bold tracking-tight">{screen ? screen.label[locale] : t("helpGeneral", locale)}</h3>
        <p className="mt-1 text-[13px] leading-6 text-foreground/80">{screen ? screen.about[locale] : t("generalAbout", locale)}</p>
      </section>

      {result.level === "none" ? (
        <PanelEmpty title={t("noHelpForPageTitle", locale)} text={t("noHelpForPageText", locale)} />
      ) : (
        <>
          {tasks.length > 0 && (
            <section>
              <SectionLabel>{t("commonTasks", locale)}</SectionLabel>
              <TaskRows cards={tasks} locale={locale} onOpen={onOpen} />
            </section>
          )}
          {result.troubleshooting.length > 0 && (
            <section>
              <SectionLabel>{t("troubleshooting", locale)}</SectionLabel>
              <TroubleRows cards={result.troubleshooting} locale={locale} onOpen={onOpen} />
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
            {type === "troubleshooting" ? <TroubleRows cards={cards} locale={locale} onOpen={onOpen} /> : <TaskRows cards={cards} locale={locale} onOpen={onOpen} />}
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
      <TaskRows cards={results} locale={locale} onOpen={onOpen} />
    </section>
  );
}

// ---------------------------------------------------------------- Reading a Guide

function stepsOf(body: GuideBlock[]) {
  return body.flatMap((b) => (b.type === "steps" ? b.items : []));
}

/** A Guide read inside the panel, walked one step at a time with Back / Next (FigJam Guides tab). */
function GuideReader({ delivery, reading, locale, from, onLeave }: {
  delivery: GuideDelivery;
  reading: NonNullable<Reading>;
  locale: Locale;
  from: string | null;
  onLeave: () => void;
}) {
  if (delivery.kind === "unavailable") return <PanelEmpty title={t("articleUnavailableTitle", locale)} text={t("articleUnavailableText", locale)} />;
  if (delivery.kind === "locale-unavailable") {
    // The panel follows the shell's language; when this Guide is missing in it, say so and link the language it has (AC-010).
    const other = delivery.available[0];
    return (
      <div role="status" className="rounded-xl border border-border p-4 text-center">
        <p className="font-semibold">{t("translationUnavailableTitle", locale, { lang: LOCALE_NAME[reading.locale][locale] })}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t("translationUnavailableText", locale, { title: delivery.otherTitle, other: LOCALE_NAME[other][locale] })}</p>
        <Link href={guideHref(reading.slug, { lang: other, from })} onClick={onLeave} className="mt-3 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground">
          {t("readIn", locale, { lang: LOCALE_NAME[other][locale] })}
        </Link>
      </div>
    );
  }

  const { guide, content } = delivery;
  // Global step number of each steps block's first item, computed up front (no mutation during render).
  const stepStart = content.body.map((_, i) => stepsOf(content.body.slice(0, i)).length);
  return (
    <article lang={delivery.locale}>
      <nav aria-label={t("breadcrumb", locale)} className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span>{t("tabGuides", locale)}</span>
        <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
        <span>{CONTENT_TYPE_LABEL[guide.contentType]}</span>
        <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
        <span className="font-semibold text-foreground">{content.title}</span>
      </nav>
      <h3 className="mt-3 text-2xl font-extrabold leading-8 tracking-tight">{content.title}</h3>
      <p className="mt-1 text-[13px] leading-6 text-foreground/80">{content.summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-2xs font-semibold text-muted-foreground">
          <Clock aria-hidden="true" className="h-3.5 w-3.5" />
          {t("updated", locale, { date: formatDate(content.updatedAt, locale) })}
        </span>
        {delivery.locale !== locale && <LocaleOnlyTag shown={delivery.locale} locale={locale} />}
      </div>

      <div className="mt-5 space-y-5">
        {content.body.map((block, i) => {
          if (block.type === "steps") {
            return (
              <ol key={i} className="space-y-5">
                {block.items.map((step, j) => {
                  const n = stepStart[i] + j;
                  const active = n === reading.step;
                  return (
                    <li key={step.title} data-step={n} aria-current={active ? "step" : undefined} className="flex gap-3 scroll-mt-4">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors",
                          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {n + 1}
                      </span>
                      <div className="min-w-0 pt-1">
                        <p className={cn("text-base font-bold leading-6", !active && "text-foreground/80")}>{step.title}</p>
                        {step.text && <p className="mt-0.5 text-[13px] leading-6 text-muted-foreground">{step.text}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            );
          }
          if (block.type === "paragraph" && i === 0) {
            return (
              <p key={i} className="border-l-2 border-primary/40 pl-3 text-[13px] leading-6 text-foreground/80">
                {block.text}
              </p>
            );
          }
          return <GuideBody key={i} body={[block]} dense />;
        })}
      </div>

      <Link href={guideHref(reading.slug, { lang: delivery.locale, from })} onClick={onLeave} className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
        {t("openInHelpCenter", locale)}
        <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
}

function ReaderFooter({ locale, step, stepCount, onBack, onNext }: { locale: Locale; step: number; stepCount: number; onBack: () => void; onNext: () => void }) {
  const last = stepCount === 0 || step >= stepCount - 1;
  return (
    <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
      <button type="button" onClick={onBack} className="inline-flex h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-foreground hover:bg-muted">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        {t("back", locale)}
      </button>
      {stepCount > 0 && (
        <span className="text-xs tabular-nums text-muted-foreground">
          {Math.min(step + 1, stepCount)} / {stepCount}
        </span>
      )}
      <button type="button" onClick={onNext} className="inline-flex h-12 min-w-36 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        {t(last ? "done" : "next", locale)}
        {!last && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
      </button>
    </footer>
  );
}

// ---------------------------------------------------------------- Support

/**
 * Escalation only (AC-024), laid out as the FigJam Support tab. Every channel comes from configuration
 * (HelpSupportConfig); an unconfigured channel is left out rather than shown with placeholder details,
 * and the system status card links to the status page instead of claiming a status it cannot see.
 */
function SupportTab({ locale, support, from, onOpen, onLeave }: { locale: Locale; support?: HelpSupportConfig; from: string | null; onOpen: (card: GuideCard) => void; onLeave: () => void }) {
  const topics = browseGuides(helpData, locale, { contentType: "troubleshooting" });
  const s = support ?? {};
  const channels: React.ReactNode[] = [];
  if (s.chatUrl) {
    channels.push(
      <ChannelRow key="chat" icon={MessagesSquare} title={t("liveChat", locale)} text={t("liveChatText", locale)}>
        <ExternalAnchor href={s.chatUrl} className="h-9 rounded-lg border border-border px-4 text-primary hover:bg-primary-soft">{t("startChat", locale)}</ExternalAnchor>
      </ChannelRow>,
    );
  }
  if (s.email) {
    channels.push(
      <ChannelRow key="email" icon={Mail} title={t("emailSupport", locale)} text={t("emailSupportText", locale)}>
        <a href={`mailto:${s.email}`} className="text-[13px] font-semibold text-primary hover:underline">{s.email}</a>
      </ChannelRow>,
    );
  }
  if (s.phone) {
    channels.push(
      <ChannelRow key="phone" icon={Phone} title={t("phoneSupport", locale)} text={t("phoneSupportText", locale)} sub={s.hours}>
        <a href={`tel:${s.phone.replace(/[^\d+]/g, "")}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-primary hover:bg-primary-soft">
          <Phone aria-hidden="true" className="h-4 w-4" />
          {s.phone}
        </a>
      </ChannelRow>,
    );
  }
  if (s.contactUrl) {
    channels.push(
      <ChannelRow key="contact" icon={MessageCircle} title={t("contactForm", locale)} text={t("contactFormText", locale)}>
        <ExternalAnchor href={s.contactUrl} className="h-9 rounded-lg border border-border px-4 text-primary hover:bg-primary-soft">{t("contactSupport", locale)}</ExternalAnchor>
      </ChannelRow>,
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <SectionLabel>{t("contactSupport", locale)}</SectionLabel>
        <p className="mt-1 text-xs text-muted-foreground">{t("supportCardText", locale)}</p>
        <div className="mt-3 divide-y divide-border-subtle rounded-xl border border-border px-4">
          {channels.length > 0 ? channels : <p className="py-4 text-xs text-muted-foreground">{t("supportNotConfigured", locale)}</p>}
        </div>
      </section>

      {topics.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <SectionLabel>{t("commonSupportTopics", locale)}</SectionLabel>
            <Link href={helpHref("/browse", { type: "troubleshooting", lang: locale, from })} onClick={onLeave} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              {t("viewAllShort", locale)}
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
          <TaskRows cards={topics} locale={locale} onOpen={onOpen} boxed />
        </section>
      )}

      {s.statusUrl && (
        <section>
          <SectionLabel>{t("systemStatus", locale)}</SectionLabel>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-border p-4">
            <Activity aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
            <p className="min-w-0 flex-1 text-[13px] text-foreground/80">{t("systemStatusText", locale)}</p>
            <ExternalAnchor href={s.statusUrl} className="text-primary hover:underline">
              {t("viewStatusPage", locale)}
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </ExternalAnchor>
          </div>
        </section>
      )}

      <section>
        <SectionLabel>{t("usefulLinks", locale)}</SectionLabel>
        <ul className="mt-2 divide-y divide-border-subtle rounded-xl border border-border px-4">
          <li>
            <Link href={helpHref("/", { lang: locale, from })} onClick={onLeave} className="group flex items-center gap-3 py-3">
              <IconBox icon={BookOpen} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold group-hover:text-primary">{t("helpCenter", locale)}</span>
                <span className="block text-xs text-muted-foreground">{t("helpCenterLinkText", locale)}</span>
              </span>
              <ExternalLink aria-hidden="true" className="h-4 w-4 text-primary" />
            </Link>
          </li>
          {s.statusUrl && (
            <li>
              <a href={s.statusUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 py-3">
                <IconBox icon={Activity} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold group-hover:text-primary">{t("statusPage", locale)}</span>
                  <span className="block text-xs text-muted-foreground">{t("statusPageText", locale)}</span>
                </span>
                <ExternalLink aria-hidden="true" className="h-4 w-4 text-primary" />
              </a>
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function ChannelRow({ icon: Icon, title, text, sub, children }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-4">
      <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        <div className="mt-2.5">{children}</div>
      </div>
    </div>
  );
}

function ExternalAnchor({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  const external = /^https?:/i.test(href);
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold", className)}>
      {children}
    </a>
  );
}

// ---------------------------------------------------------------- rows and building blocks

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">{children}</h3>;
}

function IconBox({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
      <Icon className="h-4 w-4" />
    </span>
  );
}

/** Task rows as in the reference: outline icon, title, one-line subtitle, chevron, hairline between rows. */
function TaskRows({ cards, locale, onOpen, boxed = false }: { cards: GuideCard[]; locale: Locale; onOpen: (card: GuideCard) => void; boxed?: boolean }) {
  return (
    <ul className="mt-1.5">
      {cards.map((card) => {
        const Icon = guideIcon(card.guideId, card.contentType);
        return (
          <li key={card.guideId} className="border-b border-border-subtle last:border-b-0">
            <button type="button" onClick={() => onOpen(card)} className="group flex w-full items-center gap-3 py-2.5 text-left">
              {boxed ? (
                <IconBox icon={Icon} />
              ) : (
                <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center text-primary">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
              )}
              <RowText card={card} />
              {!card.inRequestedLocale && <LocaleOnlyTag shown={card.shownLocale} locale={locale} />}
              <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-foreground/70 group-hover:text-primary" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

const TONE: Record<"danger" | "warning" | "info", string> = {
  danger: "bg-danger-soft text-danger",
  warning: "bg-warning-soft text-warning",
  info: "bg-info-soft text-info",
};

/** Troubleshooting rows: the badge colour says how serious the topic is (reference: red / amber / blue). */
function TroubleRows({ cards, locale, onOpen }: { cards: GuideCard[]; locale: Locale; onOpen: (card: GuideCard) => void }) {
  return (
    <ul className="mt-1.5">
      {cards.map((card) => {
        const { icon: Icon, tone } = troubleIcon(card.guideId);
        return (
          <li key={card.guideId} className="border-b border-border-subtle last:border-b-0">
            <button type="button" onClick={() => onOpen(card)} className="group flex w-full items-center gap-3 py-2.5 text-left">
              <span aria-hidden="true" className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full", TONE[tone])}>
                <Icon className="h-4 w-4" />
              </span>
              <RowText card={card} />
              {!card.inRequestedLocale && <LocaleOnlyTag shown={card.shownLocale} locale={locale} />}
              <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-foreground/70 group-hover:text-primary" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function RowText({ card }: { card: GuideCard }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-semibold group-hover:text-primary" lang={card.shownLocale}>{card.title}</span>
      <span className="block truncate text-xs text-muted-foreground" lang={card.shownLocale}>{card.summary}</span>
    </span>
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
