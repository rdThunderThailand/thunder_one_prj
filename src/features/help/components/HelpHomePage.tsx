import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTENT_TYPE_HINT, CONTENT_TYPE_LABEL, WORKSPACE_LABEL, guideCount, t } from "../copy";
import { guideHref, helpHref } from "../navigation";
import { localeHrefs, type HelpParams } from "../params";
import { facets, helpData, recommendedGuides, searchGuides, type GuideCard } from "../repository";
import type { Locale } from "../types";
import { ContentTypeIcon } from "./GuideMeta";
import { HelpPageShell, HiddenContext } from "./HelpPageShell";
import { CONTENT_TYPE_ART, HERO_BG, HERO_ILLUSTRATION, HOME_WORKSPACES, guideArt } from "./help-art";

/** Suggested queries under the search box (design). Shown only when they find something in that locale. */
const POPULAR_SEARCHES: Record<Locale, string[]> = {
  th: ["สร้างเพลย์ลิสต์", "เผยแพร่", "สร้างโปรแกรม", "สถานะของช่อง", "อัปโหลด"],
  en: ["create playlist", "publish content", "schedule program", "channel status", "upload media"],
};

/** HLP-001 — entries for Search, Workspace, Content Type and Recommended Guides (F01, AC-016). Layout and art: FigJam Home. */
export function HelpHomePage({ params }: { params: HelpParams }) {
  const { locale, from } = params;
  const f = facets(helpData, locale);
  const recommended = recommendedGuides(helpData, locale);
  const workspaceCount = new Map(f.workspaces.map((w) => [w.key, w.count]));
  const popular = POPULAR_SEARCHES[locale].filter((q) => searchGuides(helpData, q, locale).length > 0);

  return (
    <HelpPageShell locale={locale} from={from} localeHrefs={localeHrefs("/", params)}>
      <section className="relative isolate overflow-hidden border-b border-border bg-primary-soft">
        <Image src={HERO_BG} alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:pt-12">
          <div className="min-w-0">
            <p className="type-label text-primary">{t("helpCenter", locale)}</p>
            <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{t("heroTitle", locale)}</h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("heroSubtitle", locale)}</p>
            <form action={helpHref("/search")} role="search" className="mt-6 flex max-w-2xl gap-2 rounded-2xl border border-border bg-card p-2 shadow-float">
              <HiddenContext locale={locale} from={from} />
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">{t("searchLabel", locale)}</span>
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  name="q"
                  autoComplete="off"
                  placeholder={t("searchPlaceholder", locale)}
                  className="h-11 w-full rounded-xl bg-transparent pl-11 pr-3 text-[15px] placeholder:text-muted-foreground focus-visible:outline-none"
                />
              </label>
              <button type="submit" className="h-11 shrink-0 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                {t("search", locale)}
              </button>
            </form>
            {popular.length > 0 && (
              <div className="mt-4 flex max-w-2xl flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-foreground">{t("popularSearches", locale)}</span>
                {popular.map((q) => (
                  <Link
                    key={q}
                    href={helpHref("/search", { q, lang: locale, from })}
                    className="rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {q}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Image src={HERO_ILLUSTRATION} alt="" width={328} height={235} priority className="hidden h-auto w-[300px] lg:block" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <section aria-labelledby="by-workspace">
          <h2 id="by-workspace" className="text-base font-bold tracking-tight">{t("browseByWorkspace", locale)}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {HOME_WORKSPACES.map((w) => {
              const count = w.key ? (workspaceCount.get(w.key) ?? 0) : 0;
              const box = "flex h-full items-center gap-2.5 rounded-xl border border-border bg-card py-3 pl-3 pr-2";
              const body = (
                <>
                  <Image src={w.icon} alt="" width={32} height={32} className="shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm font-semibold", count > 0 && "group-hover:text-primary")}>{w.label}</span>
                    <span className="block text-xs text-muted-foreground">{w.description[locale]}</span>
                    <span className="mt-1 block text-2xs font-semibold text-muted-foreground">
                      {count > 0 ? guideCount(count, locale) : t("noGuidesYet", locale)}
                    </span>
                  </span>
                  <Image src={w.art} alt="" width={40} height={56} className="h-14 w-10 shrink-0 object-contain" />
                </>
              );
              return (
                <li key={w.id}>
                  {w.key && count > 0 ? (
                    <Link
                      href={helpHref("/browse", { workspace: w.key, lang: locale, from })}
                      className={cn(box, "group transition-colors hover:border-primary/40 hover:bg-primary-soft/60")}
                    >
                      {body}
                    </Link>
                  ) : (
                    // A Workspace with no Guides yet is shown (the design lists all five) but not linked to an empty list.
                    <div aria-disabled="true" className={cn(box, "opacity-70")}>
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="by-type">
          <h2 id="by-type" className="text-base font-bold tracking-tight">{t("browseByType", locale)}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {f.contentTypes.map((c) => (
              <li key={c.key}>
                <Link
                  href={helpHref("/browse", { type: c.key, lang: locale, from })}
                  className="group flex h-full items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-primary-soft/60"
                >
                  <Image src={CONTENT_TYPE_ART[c.key]} alt="" width={40} height={40} className="shrink-0 rounded-lg" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold group-hover:text-primary">{CONTENT_TYPE_LABEL[c.key]}</span>
                    <span className="block text-xs text-muted-foreground">{CONTENT_TYPE_HINT[c.key][locale]}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {recommended.length > 0 && (
          <section aria-labelledby="recommended">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="recommended" className="text-base font-bold tracking-tight">{t("recommended", locale)}</h2>
              <Link href={helpHref("/browse", { lang: locale, from })} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                {t("viewAll", locale)}
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {recommended.map((card) => (
                <li key={card.guideId}>
                  <RecommendedCard card={card} locale={locale} from={from} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </HelpPageShell>
  );
}

/** Home's Guide card (design): thumbnail, Workspace, title, summary, Content Type. */
function RecommendedCard({ card, locale, from }: { card: GuideCard; locale: Locale; from: string | null }) {
  const art = guideArt(card.guideId);
  const workspace = card.workspaces.find((w) => w !== "general");
  const workspaceArt = HOME_WORKSPACES.find((w) => w.key === workspace);
  const href = guideHref(card.slug, { lang: card.inRequestedLocale ? locale : card.shownLocale, from });
  return (
    <Link
      href={href}
      className="group flex h-full gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-primary-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted">
        {art ? <Image src={art} alt="" fill sizes="96px" className="object-cover" /> : <ContentTypeIcon type={card.contentType} size="lg" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        {workspace && (
          <span className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wide text-primary">
            {workspaceArt && <Image src={workspaceArt.icon} alt="" width={14} height={14} className="rounded-sm" />}
            {workspaceArt?.label ?? WORKSPACE_LABEL[workspace][locale]}
          </span>
        )}
        <span className="mt-1 flex items-start gap-1">
          <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground group-hover:text-primary" lang={card.shownLocale}>
            {card.title}
          </span>
          <ChevronRight aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
        </span>
        <span className="mt-1 line-clamp-2 text-xs text-muted-foreground" lang={card.shownLocale}>
          {card.summary}
        </span>
        <span className="mt-auto flex items-center gap-1.5 pt-2 text-2xs font-semibold text-muted-foreground">
          <Image src={CONTENT_TYPE_ART[card.contentType]} alt="" width={14} height={14} className="rounded-sm" />
          {CONTENT_TYPE_LABEL[card.contentType]}
        </span>
      </span>
    </Link>
  );
}
