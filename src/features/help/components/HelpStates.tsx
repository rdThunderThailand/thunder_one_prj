import Link from "next/link";
import { AlertTriangle, FileQuestion, LayoutGrid, SearchX, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/lovable/skeleton";
import { cn } from "@/lib/utils";
import { t } from "../copy";
import { helpHref } from "../navigation";
import type { Locale } from "../types";
import { HiddenContext, SupportLink } from "./HelpPageShell";

function StateFrame({ icon: Icon, tone = "neutral", title, text, children, role }: {
  icon: LucideIcon;
  tone?: "neutral" | "danger";
  title: string;
  text: string;
  children?: React.ReactNode;
  role?: "alert" | "status";
}) {
  return (
    <div role={role} className="mx-auto flex max-w-xl flex-col items-center px-4 py-14 text-center">
      <span
        aria-hidden="true"
        className={cn("grid h-14 w-14 place-items-center rounded-2xl", tone === "danger" ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary")}
      >
        <Icon className="h-6 w-6" strokeWidth={1.8} />
      </span>
      <h2 className="mt-4 text-lg font-bold tracking-tight">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{text}</p>
      {children && <div className="mt-6 w-full">{children}</div>}
    </div>
  );
}

/** HLP-006 — zero results is a normal outcome with ways forward, never a system error (AC-005). */
export function NoResults({ query, locale, from }: { query: string; locale: Locale; from: string | null }) {
  return (
    <StateFrame icon={SearchX} title={t("noResultsTitle", locale)} text={t("noResultsText", locale, { q: query })} role="status">
      <div className="rounded-xl border border-border bg-card p-4 text-left">
        <p className="type-label text-muted-foreground">{t("tryThis", locale)}</p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• {t("trySpelling", locale)}</li>
          <li>• {t("tryFewer", locale)}</li>
          <li>• {t("tryBrowse", locale)}</li>
        </ul>
        <form action={helpHref("/search")} role="search" className="mt-4 flex gap-2">
          <HiddenContext locale={locale} from={from} />
          <label className="min-w-0 flex-1">
            <span className="sr-only">{t("newSearch", locale)}</span>
            <input
              type="search"
              name="q"
              placeholder={t("searchPlaceholder", locale)}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <button type="submit" className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
            {t("search", locale)}
          </button>
        </form>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link href={helpHref("/browse", { lang: locale, from })} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-4 text-xs font-semibold hover:bg-muted">
          <LayoutGrid aria-hidden="true" className="h-3.5 w-3.5" />
          {t("browseGuides", locale)}
        </Link>
        <SupportLink locale={locale} variant="outline" />
      </div>
    </StateFrame>
  );
}

/** HLP-005/006 — a filter combination with no published Guides. */
export function NoGuides({ locale, from }: { locale: Locale; from: string | null }) {
  return (
    <StateFrame icon={LayoutGrid} title={t("noGuidesTitle", locale)} text={t("noGuidesText", locale)} role="status">
      <Link href={helpHref("/browse", { lang: locale, from })} className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-4 text-xs font-semibold hover:bg-muted">
        {t("clearFilters", locale)}
      </Link>
    </StateFrame>
  );
}

/** HLP-008 — article not available: unknown, unpublished, archived or a dead shared link (F03, AC-015). */
export function ArticleUnavailable({ locale, from }: { locale: Locale; from: string | null }) {
  return (
    <StateFrame icon={FileQuestion} title={t("articleUnavailableTitle", locale)} text={t("articleUnavailableText", locale)} role="status">
      <div className="flex flex-wrap justify-center gap-2">
        <Link href={helpHref("/", { lang: locale, from })} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
          {t("openHelpCenter", locale)}
        </Link>
        <Link href={helpHref("/browse", { lang: locale, from })} className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-4 text-xs font-semibold hover:bg-muted">
          {t("browseGuides", locale)}
        </Link>
      </div>
    </StateFrame>
  );
}

/** HLP-008 — Help itself failed. Says plainly that ThunderOne work is unaffected (D-G6-04). */
export function HelpUnavailable({ locale, onRetry, compact = false }: { locale: Locale; onRetry?: () => void; compact?: boolean }) {
  return (
    <StateFrame icon={AlertTriangle} tone="danger" title={t(compact ? "drawerErrorTitle" : "unableToLoadTitle", locale)} text={t(compact ? "drawerErrorText" : "unableToLoadText", locale)} role="alert">
      <div className="flex flex-wrap justify-center gap-2">
        {onRetry && (
          <button type="button" onClick={onRetry} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
            {t("tryAgain", locale)}
          </button>
        )}
        <SupportLink locale={locale} variant="outline" />
      </div>
    </StateFrame>
  );
}

// ---------------------------------------------------------------- HLP-007 skeletons

function SkeletonFrame({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{t("loading", locale)}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

export function GuideRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-4">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2.5 h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeSkeleton({ locale }: { locale: Locale }) {
  return (
    <SkeletonFrame locale={locale}>
      <div className="border-b border-border bg-surface-subtle">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          <Skeleton className="mt-6 h-12 w-full max-w-2xl rounded-xl" />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-3 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <GuideRowsSkeleton rows={3} />
      </div>
    </SkeletonFrame>
  );
}

export function ListPageSkeleton({ locale }: { locale: Locale }) {
  return (
    <SkeletonFrame locale={locale}>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <div className="hidden space-y-2 lg:block">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-7" />
          ))}
        </div>
        <div>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-2 h-4 w-40" />
          <div className="mt-6">
            <GuideRowsSkeleton />
          </div>
        </div>
      </div>
    </SkeletonFrame>
  );
}

export function ArticleSkeleton({ locale }: { locale: Locale }) {
  return (
    <SkeletonFrame locale={locale}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <Skeleton className="h-3 w-64" />
          <Skeleton className="mt-6 h-9 w-2/3" />
          <Skeleton className="mt-3 h-4 w-1/2" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={cn("h-4", i % 3 === 2 ? "w-2/3" : "w-full")} />
            ))}
          </div>
        </div>
        <div className="hidden space-y-2 lg:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5" />
          ))}
        </div>
      </div>
    </SkeletonFrame>
  );
}
