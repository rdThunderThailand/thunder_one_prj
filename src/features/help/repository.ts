// The Help content service (Help Spec §5): Guide Delivery, Search, Context Resolver, Locale Resolver
// and Related Guide Resolver over one data set. The public Help Center and the authenticated drawer
// both call these functions, so they can never disagree about what a Guide says (D-G7-04, AC-020).
//
// Everything here is pure and synchronous over `HelpData`. When Help content moves to a backend,
// this file is the seam: keep the function signatures, swap the data source.

import { CONTEXT_MAPPINGS, GUIDE_RELATIONSHIPS, RECOMMENDED_GUIDE_IDS, USE_CASE_MAPPINGS } from "./content/mappings.ts";
import { GUIDES } from "./content/guides.ts";
import {
  CONTENT_TYPES,
  DEFAULT_LOCALE,
  LOCALES,
  type ContentType,
  type ContextMapping,
  type Guide,
  type GuideBlock,
  type GuideLocale,
  type GuideRelationship,
  type HelpContext,
  type Locale,
  type UseCaseMapping,
  type WorkspaceKey,
} from "./types.ts";

export interface HelpData {
  guides: Guide[];
  contextMappings: ContextMapping[];
  relationships: GuideRelationship[];
  useCaseMappings: UseCaseMapping[];
  recommendedGuideIds: string[];
}

export const helpData: HelpData = {
  guides: GUIDES,
  contextMappings: CONTEXT_MAPPINGS,
  relationships: GUIDE_RELATIONSHIPS,
  useCaseMappings: USE_CASE_MAPPINGS,
  recommendedGuideIds: RECOMMENDED_GUIDE_IDS,
};

// ---------------------------------------------------------------- locale

export function parseLocale(value: unknown): Locale | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v) ? (v as Locale) : null;
}

export function resolveLocale(value: unknown): Locale {
  return parseLocale(value) ?? DEFAULT_LOCALE;
}

export function parseContentType(value: unknown): ContentType | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && (CONTENT_TYPES as readonly string[]).includes(v) ? (v as ContentType) : null;
}

// ---------------------------------------------------------------- publication rules

/** Public iff the Guide and the requested locale are both PUBLISHED (D-G6-01, D-G8-03, AC-008, AC-015). */
export function isPublic(guide: Guide, locale: Locale): boolean {
  return guide.lifecycleStatus === "PUBLISHED" && guide.locales[locale]?.publicationStatus === "PUBLISHED";
}

export function publicLocales(guide: Guide): Locale[] {
  return LOCALES.filter((l) => isPublic(guide, l));
}

function isDeliverable(guide: Guide | undefined): guide is Guide {
  return !!guide && publicLocales(guide).length > 0;
}

function byId(data: HelpData, guideId: string): Guide | undefined {
  return data.guides.find((g) => g.guideId === guideId);
}

/** Workspaces a Guide belongs to, derived from its mappings. Taxonomy only: never a second copy of the Guide (AC-022). */
export function guideWorkspaces(data: HelpData, guideId: string): WorkspaceKey[] {
  const keys = new Set<WorkspaceKey>();
  for (const m of data.contextMappings) if (m.guideId === guideId) keys.add(m.workspaceKey);
  for (const m of data.useCaseMappings) if (m.guideId === guideId) keys.add(m.workspaceKey);
  return [...keys].sort((a, b) => (a === "general" ? 1 : b === "general" ? -1 : a.localeCompare(b)));
}

// ---------------------------------------------------------------- cards (list items)

export interface GuideCard {
  guideId: string;
  slug: string;
  contentType: ContentType;
  workspaces: WorkspaceKey[];
  /** The locale the title/summary below are in. */
  shownLocale: Locale;
  /** False when the requested locale is not published, so the card is showing another language (AC-010). */
  inRequestedLocale: boolean;
  title: string;
  summary: string;
  updatedAt: string;
}

/** A list item in the requested locale, or in the other published locale, clearly flagged. Null when not public at all. */
export function cardFor(data: HelpData, guide: Guide, locale: Locale): GuideCard | null {
  const available = publicLocales(guide);
  if (available.length === 0) return null;
  const shown = available.includes(locale) ? locale : available[0];
  const content = guide.locales[shown] as GuideLocale;
  return {
    guideId: guide.guideId,
    slug: guide.publicSlug,
    contentType: guide.contentType,
    workspaces: guideWorkspaces(data, guide.guideId),
    shownLocale: shown,
    inRequestedLocale: shown === locale,
    title: content.title,
    summary: content.summary,
    updatedAt: content.updatedAt,
  };
}

function cards(data: HelpData, ids: string[], locale: Locale, exclude: Set<string> = new Set()): GuideCard[] {
  const seen = new Set(exclude);
  const out: GuideCard[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const guide = byId(data, id);
    const card = guide && cardFor(data, guide, locale);
    if (card) out.push(card);
  }
  return out;
}

// ---------------------------------------------------------------- Guide Delivery

export type GuideDelivery =
  | { kind: "ok"; guide: Guide; content: GuideLocale; locale: Locale; available: Locale[] }
  | { kind: "locale-unavailable"; guide: Guide; requested: Locale; available: Locale[]; otherTitle: string }
  | { kind: "unavailable" };

/**
 * One Guide for reading. A missing locale is reported, never silently replaced (D-G6-03, AC-010);
 * a Guide that is unknown, unpublished or archived is "unavailable" (F03, AC-015).
 */
export function deliverGuide(data: HelpData, slug: string, locale: Locale): GuideDelivery {
  const guide = data.guides.find((g) => g.publicSlug === slug);
  if (!guide) return { kind: "unavailable" };
  const available = publicLocales(guide);
  if (available.length === 0) return { kind: "unavailable" };
  if (!available.includes(locale)) {
    const other = guide.locales[available[0]] as GuideLocale;
    return { kind: "locale-unavailable", guide, requested: locale, available, otherTitle: other.title };
  }
  return { kind: "ok", guide, content: guide.locales[locale] as GuideLocale, locale, available };
}

// ---------------------------------------------------------------- Related Guide Resolver

export interface RelatedGuides {
  related: GuideCard[];
  troubleshooting: GuideCard[];
}

/** Related and Troubleshooting Guides of one Guide. Non-public targets are dropped (AC-021). */
export function relatedGuides(data: HelpData, guideId: string, locale: Locale): RelatedGuides {
  const of = (type: GuideRelationship["relationshipType"]) =>
    data.relationships.filter((r) => r.sourceGuideId === guideId && r.relationshipType === type).map((r) => r.targetGuideId);
  const self = new Set([guideId]);
  const related = cards(data, of("RELATED"), locale, self);
  const troubleshooting = cards(data, of("TROUBLESHOOTING"), locale, new Set([guideId, ...related.map((c) => c.guideId)]));
  return { related, troubleshooting };
}

// ---------------------------------------------------------------- Context Resolver

export type ContextLevel = "exact" | "screen" | "workspace" | "general" | "none";

export interface ContextResult extends RelatedGuides {
  level: ContextLevel;
  primary: GuideCard[];
}

const QUALIFIERS = ["objectType", "action", "state"] as const;

function hasQualifier(m: ContextMapping): boolean {
  return QUALIFIERS.some((q) => m[q] !== undefined);
}

function levelMappings(data: HelpData, ctx: HelpContext, level: Exclude<ContextLevel, "none">): ContextMapping[] {
  return data.contextMappings.filter((m) => {
    switch (level) {
      case "exact":
        return m.workspaceKey === ctx.workspaceKey && !!ctx.screenKey && m.screenKey === ctx.screenKey
          && hasQualifier(m) && QUALIFIERS.every((q) => m[q] === undefined || m[q] === ctx[q]);
      case "screen":
        return m.workspaceKey === ctx.workspaceKey && !!ctx.screenKey && m.screenKey === ctx.screenKey && !hasQualifier(m);
      case "workspace":
        return ctx.workspaceKey !== "general" && m.workspaceKey === ctx.workspaceKey && m.screenKey === undefined;
      case "general":
        return m.workspaceKey === "general" && m.screenKey === undefined;
    }
  });
}

/**
 * Deterministic resolution Exact → Screen → Workspace → General Help (D-G6-02, AC-002, AC-003).
 * A level counts only if it yields at least one public PRIMARY Guide; otherwise resolution falls
 * through. Never throws: "none" means the drawer shows its no-result recovery (UC-008).
 */
export function resolveContext(data: HelpData, ctx: HelpContext): ContextResult {
  const levels: Exclude<ContextLevel, "none">[] = ["exact", "screen", "workspace", "general"];
  for (const level of levels) {
    const mappings = levelMappings(data, ctx, level);
    const ids = (type: ContextMapping["relationshipType"]) => mappings.filter((m) => m.relationshipType === type).map((m) => m.guideId);
    const primary = cards(data, ids("PRIMARY"), ctx.locale);
    if (primary.length === 0) continue;

    const primaryIds = primary.map((c) => c.guideId);
    const fromRel = (type: GuideRelationship["relationshipType"]) =>
      data.relationships.filter((r) => primaryIds.includes(r.sourceGuideId) && r.relationshipType === type).map((r) => r.targetGuideId);
    const related = cards(data, [...ids("RELATED"), ...fromRel("RELATED")], ctx.locale, new Set(primaryIds));
    const troubleshooting = cards(
      data,
      [...ids("TROUBLESHOOTING"), ...fromRel("TROUBLESHOOTING")],
      ctx.locale,
      new Set([...primaryIds, ...related.map((c) => c.guideId)]),
    );
    return { level, primary, related, troubleshooting };
  }
  return { level: "none", primary: [], related: [], troubleshooting: [] };
}

// ---------------------------------------------------------------- Search

export interface GuideFilters {
  workspace?: WorkspaceKey | null;
  contentType?: ContentType | null;
}

function matchesFilters(card: GuideCard, filters: GuideFilters): boolean {
  if (filters.workspace && !card.workspaces.includes(filters.workspace)) return false;
  if (filters.contentType && card.contentType !== filters.contentType) return false;
  return true;
}

function normalize(text: string): string {
  return text.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
}

function blockText(block: GuideBlock): string {
  switch (block.type) {
    case "heading":
    case "paragraph":
      return block.text;
    case "note":
      return `${block.title ?? ""} ${block.text}`;
    case "list":
      return block.items.join(" ");
    case "steps":
      return block.items.map((i) => `${i.title} ${i.text ?? ""}`).join(" ");
  }
}

// MVP relevance: Title > Summary > Keywords > Guide body (F02).
const WEIGHTS = { title: 8, summary: 4, keywords: 2, body: 1 } as const;

export function scoreGuide(content: GuideLocale, query: string): number {
  const q = normalize(query);
  if (!q) return 0;
  // Thai has no spaces between words, so the whole phrase is always a term; spaced queries add their words.
  const terms = [...new Set([q, ...q.split(" ").filter((t) => t.length > 1)])];
  const fields = {
    title: normalize(content.title),
    summary: normalize(content.summary),
    keywords: normalize((content.keywords ?? []).join(" | ")),
    body: normalize(content.body.map(blockText).join(" ")),
  };
  let score = 0;
  for (const term of terms) {
    for (const field of Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]) {
      if (fields[field].includes(term)) score += WEIGHTS[field] * (term === q ? 2 : 1);
    }
  }
  return score;
}

/** Search active-locale PUBLISHED content only (F02, AC-004). An empty query returns nothing; the page shows Browse/Recommended instead. */
export function searchGuides(data: HelpData, query: string, locale: Locale, filters: GuideFilters = {}): GuideCard[] {
  if (!normalize(query)) return [];
  const scored: { card: GuideCard; score: number }[] = [];
  for (const guide of data.guides) {
    if (!isPublic(guide, locale)) continue;
    const score = scoreGuide(guide.locales[locale] as GuideLocale, query);
    if (score === 0) continue;
    const card = cardFor(data, guide, locale) as GuideCard;
    if (matchesFilters(card, filters)) scored.push({ card, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.card.title.localeCompare(b.card.title, locale))
    .map((s) => s.card);
}

// ---------------------------------------------------------------- Browse

/** Public Guides for Browse (F01). Workspace and Content Type filter; they never duplicate a Guide (AC-022). */
export function browseGuides(data: HelpData, locale: Locale, filters: GuideFilters = {}): GuideCard[] {
  const typeOrder = (t: ContentType) => CONTENT_TYPES.indexOf(t);
  return data.guides
    .filter(isDeliverable)
    .map((g) => cardFor(data, g, locale) as GuideCard)
    .filter((c) => matchesFilters(c, filters))
    .sort((a, b) => typeOrder(a.contentType) - typeOrder(b.contentType) || a.title.localeCompare(b.title, locale));
}

export interface Facets {
  workspaces: { key: WorkspaceKey; count: number }[];
  contentTypes: { key: ContentType; count: number }[];
}

/** Counts for filter controls. Each facet counts within the other facet's current filter. */
export function facets(data: HelpData, locale: Locale, filters: GuideFilters = {}, source?: GuideCard[]): Facets {
  const all = source ?? browseGuides(data, locale);
  const workspaces = new Map<WorkspaceKey, number>();
  for (const c of all) {
    if (filters.contentType && c.contentType !== filters.contentType) continue;
    for (const w of c.workspaces) workspaces.set(w, (workspaces.get(w) ?? 0) + 1);
  }
  const contentTypes = CONTENT_TYPES.map((key) => ({
    key,
    count: all.filter((c) => c.contentType === key && (!filters.workspace || c.workspaces.includes(filters.workspace))).length,
  }));
  return {
    workspaces: [...workspaces.entries()]
      .sort(([a], [b]) => (a === "general" ? 1 : b === "general" ? -1 : a.localeCompare(b)))
      .map(([key, count]) => ({ key, count })),
    contentTypes,
  };
}

export function recommendedGuides(data: HelpData, locale: Locale): GuideCard[] {
  return cards(data, data.recommendedGuideIds, locale);
}
