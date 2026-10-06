import Link from "next/link";
import { ArrowRight, Boxes, ChevronRight, LayoutGrid, Search } from "lucide-react";
import { CONTENT_TYPE_HINT, CONTENT_TYPE_LABEL, WORKSPACE_LABEL, guideCount, t } from "../copy";
import { helpHref } from "../navigation";
import { localeHrefs, type HelpParams } from "../params";
import { facets, helpData, recommendedGuides } from "../repository";
import { GuideRow } from "./GuideList";
import { ContentTypeIcon } from "./GuideMeta";
import { HelpPageShell, HiddenContext } from "./HelpPageShell";

/** HLP-001 — entries for Search, Workspace, Content Type and Recommended Guides (F01, AC-016). */
export function HelpHomePage({ params }: { params: HelpParams }) {
  const { locale, from } = params;
  const f = facets(helpData, locale);
  const recommended = recommendedGuides(helpData, locale);

  return (
    <HelpPageShell locale={locale} from={from} localeHrefs={localeHrefs("/", params)}>
      <section className="border-b border-border bg-gradient-to-b from-primary-soft to-background">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 sm:pt-16">
          <p className="type-label text-primary">{t("helpCenter", locale)}</p>
          <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">{t("heroTitle", locale)}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("heroSubtitle", locale)}</p>
          <form action={helpHref("/search")} role="search" className="mt-7 flex max-w-2xl gap-2 rounded-2xl border border-border bg-card p-2 shadow-float">
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
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
        <section aria-labelledby="by-workspace">
          <h2 id="by-workspace" className="text-base font-bold tracking-tight">{t("browseByWorkspace", locale)}</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {f.workspaces.map((w) => (
              <li key={w.key}>
                <Link
                  href={helpHref("/browse", { workspace: w.key, lang: locale, from })}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
                >
                  <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                    {w.key === "general" ? <Boxes className="h-5 w-5" /> : <LayoutGrid className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold group-hover:text-primary">{WORKSPACE_LABEL[w.key][locale]}</span>
                    <span className="block text-xs text-muted-foreground">{guideCount(w.count, locale)}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="by-type">
          <h2 id="by-type" className="text-base font-bold tracking-tight">{t("browseByType", locale)}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {f.contentTypes.map((c) => (
              <li key={c.key}>
                <Link
                  href={helpHref("/browse", { type: c.key, lang: locale, from })}
                  className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft/40"
                >
                  <ContentTypeIcon type={c.key} />
                  <span>
                    <span className="block text-sm font-semibold group-hover:text-primary">{CONTENT_TYPE_LABEL[c.key]}</span>
                    <span className="block text-xs text-muted-foreground">{CONTENT_TYPE_HINT[c.key][locale]}</span>
                  </span>
                  <span className="mt-auto text-2xs font-semibold text-muted-foreground">{guideCount(c.count, locale)}</span>
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
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {recommended.map((card) => (
                <li key={card.guideId}>
                  <GuideRow card={card} locale={locale} from={from} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </HelpPageShell>
  );
}
