import Link from "next/link";
import { Check, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTENT_TYPE_LABEL, WORKSPACE_LABEL, t } from "../copy";
import { helpHref, type HelpQuery } from "../navigation";
import type { Facets, GuideFilters } from "../repository";
import type { Locale } from "../types";

interface Props {
  path: "/search" | "/browse";
  locale: Locale;
  from: string | null;
  query?: string;
  filters: GuideFilters;
  facets: Facets;
}

/**
 * Workspace and Content Type are filters over one set of Guides, not navigation silos (G2 baseline,
 * AC-022). Plain links, so filtered views are shareable and work without JavaScript.
 */
export function FilterPanel({ path, locale, from, query, filters, facets }: Props) {
  const href = (next: Partial<HelpQuery>) =>
    helpHref(path, { q: query, workspace: filters.workspace, type: filters.contentType, lang: locale, from, ...next });
  const active = !!(filters.workspace || filters.contentType);

  const body = (
    <div className="space-y-5">
      <FilterGroup title={t("workspace", locale)}>
        <FilterLink href={href({ workspace: null })} selected={!filters.workspace} label={t("all", locale)} />
        {facets.workspaces.map((w) => (
          <FilterLink key={w.key} href={href({ workspace: w.key })} selected={filters.workspace === w.key} label={WORKSPACE_LABEL[w.key][locale]} count={w.count} />
        ))}
      </FilterGroup>
      <FilterGroup title={t("contentType", locale)}>
        <FilterLink href={href({ type: null })} selected={!filters.contentType} label={t("all", locale)} />
        {facets.contentTypes.map((c) => (
          <FilterLink key={c.key} href={href({ type: c.key })} selected={filters.contentType === c.key} label={CONTENT_TYPE_LABEL[c.key]} count={c.count} />
        ))}
      </FilterGroup>
      {active && (
        <Link href={href({ workspace: null, type: null })} className="inline-block text-xs font-semibold text-primary hover:underline">
          {t("clearFilters", locale)}
        </Link>
      )}
    </div>
  );

  return (
    <>
      <details className="group rounded-xl border border-border bg-card lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold">
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
          {t("filters", locale)}
          {active && <span className="ml-auto h-2 w-2 rounded-full bg-primary" aria-hidden="true" />}
        </summary>
        <div className="border-t border-border px-4 py-4">{body}</div>
      </details>
      <aside aria-label={t("filters", locale)} className="hidden lg:block">
        <div className="sticky top-24 rounded-xl border border-border bg-card p-4">{body}</div>
      </aside>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="type-label mb-2 text-muted-foreground">{title}</p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function FilterLink({ href, selected, label, count }: { href: string; selected: boolean; label: string; count?: number }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
          selected ? "bg-primary-soft font-semibold text-primary" : "text-foreground hover:bg-muted",
        )}
      >
        <span aria-hidden="true" className={cn("grid h-4 w-4 place-items-center rounded border", selected ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count !== undefined && <span className="text-2xs tabular-nums text-muted-foreground">{count}</span>}
      </Link>
    </li>
  );
}
