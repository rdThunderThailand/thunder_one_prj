import Link from "next/link";
import { Languages } from "lucide-react";
import { CONTENT_TYPE_LABEL, LOCALE_NAME, WORKSPACE_LABEL, formatDate, t } from "../copy";
import { guideHref, helpHref } from "../navigation";
import type { HelpParams } from "../params";
import { deliverGuide, guideWorkspaces, helpData, relatedGuides, type GuideDelivery } from "../repository";
import { LOCALES, type Locale } from "../types";
import { GuideBody, guideOutline } from "./GuideBody";
import { GuideList } from "./GuideList";
import { ContentTypeIcon, ContentTypeTag, WorkspaceTag } from "./GuideMeta";
import { HelpPageShell, SupportLink } from "./HelpPageShell";
import { ArticleUnavailable } from "./HelpStates";

export function articleTitle(slug: string, locale: Locale): string | null {
  const d = deliverGuide(helpData, slug, locale);
  return d.kind === "ok" ? d.content.title : d.kind === "locale-unavailable" ? d.otherTitle : null;
}

/** HLP-003 — one Guide, public and shareable, no login (F03, AC-007, AC-009, AC-010, AC-019). */
export function HelpArticlePage({ slug, params }: { slug: string; params: HelpParams }) {
  const { locale, from } = params;
  const delivery = deliverGuide(helpData, slug, locale);
  const hrefs = Object.fromEntries(LOCALES.map((l) => [l, guideHref(slug, { lang: l, from })])) as Record<Locale, string>;

  return (
    <HelpPageShell locale={locale} from={from} localeHrefs={hrefs} headerSearch={{}}>
      {delivery.kind === "unavailable" ? (
        <ArticleUnavailable locale={locale} from={from} />
      ) : delivery.kind === "locale-unavailable" ? (
        <TranslationUnavailable delivery={delivery} slug={slug} locale={locale} from={from} />
      ) : (
        <Article delivery={delivery} locale={locale} from={from} />
      )}
    </HelpPageShell>
  );
}

/** The requested language is missing: say so and offer the language that exists — never show it under this label (D-G6-03, AC-010). */
function TranslationUnavailable({ delivery, slug, locale, from }: { delivery: Extract<GuideDelivery, { kind: "locale-unavailable" }>; slug: string; locale: Locale; from: string | null }) {
  const other = delivery.available[0];
  return (
    <div role="status" className="mx-auto flex max-w-xl flex-col items-center px-4 py-14 text-center">
      <span aria-hidden="true" className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Languages className="h-6 w-6" strokeWidth={1.8} />
      </span>
      <h1 className="mt-4 text-lg font-bold tracking-tight">{t("translationUnavailableTitle", locale, { lang: LOCALE_NAME[locale][locale] })}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("translationUnavailableText", locale, { title: delivery.otherTitle, other: LOCALE_NAME[other][locale] })}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href={guideHref(slug, { lang: other, from })} hrefLang={other} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
          {t("readIn", locale, { lang: LOCALE_NAME[other][locale] })}
        </Link>
        <Link href={helpHref("/", { lang: locale, from })} className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-4 text-xs font-semibold hover:bg-muted">
          {t("openHelpCenter", locale)}
        </Link>
      </div>
    </div>
  );
}

function Article({ delivery, locale, from }: { delivery: Extract<GuideDelivery, { kind: "ok" }>; locale: Locale; from: string | null }) {
  const { guide, content } = delivery;
  const workspaces = guideWorkspaces(helpData, guide.guideId).filter((w) => w !== "general");
  const primaryWorkspace = workspaces[0] ?? null;
  const outline = guideOutline(content.body);
  const { related, troubleshooting } = relatedGuides(helpData, guide.guideId, locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label={t("breadcrumb", locale)} className="text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={helpHref("/", { lang: locale, from })} className="hover:text-primary hover:underline">{t("helpCenter", locale)}</Link>
          </li>
          {primaryWorkspace && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={helpHref("/browse", { workspace: primaryWorkspace, lang: locale, from })} className="hover:text-primary hover:underline">
                  {WORKSPACE_LABEL[primaryWorkspace][locale]}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li>
            <Link href={helpHref("/browse", { workspace: primaryWorkspace, type: guide.contentType, lang: locale, from })} className="hover:text-primary hover:underline">
              {CONTENT_TYPE_LABEL[guide.contentType]}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="max-w-[16rem] truncate font-medium text-foreground">{content.title}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article lang={locale} className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-panel sm:p-8">
          <div className="flex items-start gap-4">
            <ContentTypeIcon type={guide.contentType} size="lg" className="hidden sm:grid" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                {workspaces.map((w) => <WorkspaceTag key={w} workspace={w} locale={locale} />)}
                <ContentTypeTag type={guide.contentType} />
              </div>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{content.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{content.summary}</p>
              <p className="mt-3 text-2xs text-muted-foreground">
                {t("updated", locale, { date: formatDate(content.updatedAt, locale) })}
                {delivery.available.length < LOCALES.length && <> · {t("onlyIn", locale, { lang: LOCALE_NAME[locale][locale] })}</>}
              </p>
            </div>
          </div>
          <hr className="my-6 border-border" />
          <GuideBody body={content.body} />
        </article>

        <aside className="space-y-6">
          {outline.length > 1 && (
            <nav aria-labelledby="toc" className="rounded-xl border border-border bg-card p-4">
              <p id="toc" className="type-label text-muted-foreground">{t("onThisPage", locale)}</p>
              <ol className="mt-2 space-y-1 text-[13px]">
                {outline.map((h, i) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="flex gap-2 rounded px-1 py-0.5 text-foreground hover:text-primary">
                      <span className="tabular-nums text-muted-foreground">{i + 1}.</span>
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {related.length > 0 && (
            <section aria-labelledby="related">
              <h2 id="related" className="type-label mb-2 text-muted-foreground">{t("relatedGuides", locale)}</h2>
              <GuideList cards={related} locale={locale} from={from} compact />
            </section>
          )}
          {troubleshooting.length > 0 && (
            <section aria-labelledby="troubleshooting">
              <h2 id="troubleshooting" className="type-label mb-2 text-muted-foreground">{t("troubleshooting", locale)}</h2>
              <GuideList cards={troubleshooting} locale={locale} from={from} compact />
            </section>
          )}
          <SupportLink locale={locale} variant="outline" />
        </aside>
      </div>
    </div>
  );
}
