import Link from "next/link";
import { CONTENT_TYPE_LABEL, WORKSPACE_LABEL, guideCount, t } from "../copy";
import { helpHref } from "../navigation";
import { localeHrefs, type HelpParams } from "../params";
import { browseGuides, facets, helpData, recommendedGuides, searchGuides } from "../repository";
import { FilterPanel } from "./FilterPanel";
import { GuideList } from "./GuideList";
import { HelpPageShell } from "./HelpPageShell";
import { NoGuides, NoResults } from "./HelpStates";

function Breadcrumb({ locale, from, current }: { locale: HelpParams["locale"]; from: string | null; current: string }) {
  return (
    <nav aria-label={t("breadcrumb", locale)} className="text-xs text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href={helpHref("/", { lang: locale, from })} className="hover:text-primary hover:underline">{t("helpCenter", locale)}</Link>
        </li>
        <li aria-hidden="true">/</li>
        <li aria-current="page" className="font-medium text-foreground">{current}</li>
      </ol>
    </nav>
  );
}

/** HLP-002 / HLP-006 — Search Results and No Results (F02, AC-004, AC-005). */
export function HelpSearchPage({ params }: { params: HelpParams }) {
  const { locale, from, q, workspace, type } = params;
  const filters = { workspace, contentType: type };

  // Empty query → Browse/Recommended instead of a fabricated answer (F02).
  if (!q) {
    const recommended = recommendedGuides(helpData, locale);
    return (
      <HelpPageShell locale={locale} from={from} localeHrefs={localeHrefs("/search", params)} headerSearch={{}}>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Breadcrumb locale={locale} from={from} current={t("searchResults", locale)} />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{t("emptyQueryTitle", locale)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("emptyQueryText", locale)}</p>
          <div className="mt-6">
            <GuideList cards={recommended} locale={locale} from={from} />
          </div>
          <Link href={helpHref("/browse", { lang: locale, from })} className="mt-4 inline-block text-xs font-semibold text-primary hover:underline">
            {t("viewAll", locale)}
          </Link>
        </div>
      </HelpPageShell>
    );
  }

  const unfiltered = searchGuides(helpData, q, locale);
  const results = searchGuides(helpData, q, locale, filters);

  return (
    <HelpPageShell locale={locale} from={from} localeHrefs={localeHrefs("/search", params)} headerSearch={{ query: q }}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Breadcrumb locale={locale} from={from} current={t("searchResults", locale)} />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{t("searchResults", locale)}</h1>
        <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
          {t(results.length === 1 ? "resultFor" : "resultsFor", locale, { n: results.length, q })}
        </p>

        {unfiltered.length === 0 ? (
          <NoResults query={q} locale={locale} from={from} />
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
            <FilterPanel path="/search" locale={locale} from={from} query={q} filters={filters} facets={facets(helpData, locale, filters, unfiltered)} />
            {results.length === 0 ? <NoGuides locale={locale} from={from} /> : <GuideList cards={results} locale={locale} from={from} />}
          </div>
        )}
      </div>
    </HelpPageShell>
  );
}

/** HLP-005 — Browse / Category Results (F01, AC-006, AC-022). */
export function HelpBrowsePage({ params }: { params: HelpParams }) {
  const { locale, from, workspace, type } = params;
  const filters = { workspace, contentType: type };
  const cards = browseGuides(helpData, locale, filters);
  const title = type ? CONTENT_TYPE_LABEL[type] : workspace ? WORKSPACE_LABEL[workspace][locale] : t("allGuides", locale);
  const subtitle = type && workspace ? WORKSPACE_LABEL[workspace][locale] : null;

  return (
    <HelpPageShell locale={locale} from={from} localeHrefs={localeHrefs("/browse", params)} headerSearch={{}}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Breadcrumb locale={locale} from={from} current={title} />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {subtitle && <span className="font-medium text-foreground">{subtitle} · </span>}
          {guideCount(cards.length, locale)}
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
          <FilterPanel path="/browse" locale={locale} from={from} filters={filters} facets={facets(helpData, locale, filters)} />
          {cards.length === 0 ? <NoGuides locale={locale} from={from} /> : <GuideList cards={cards} locale={locale} from={from} />}
        </div>
      </div>
    </HelpPageShell>
  );
}
