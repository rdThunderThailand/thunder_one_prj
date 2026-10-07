// Help Workspace domain model (Help Product Specification v0.1 §2, G3).
// Help is a Platform Utility: it owns the content model and context resolution,
// never business data. Field names follow the spec so traceability stays 1:1.

export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "th";

/** Guide and Guide Locale lifecycle. Only PUBLISHED is ever delivered publicly (D-G6-01). */
export type LifecycleStatus = "DRAFT" | "IN REVIEW" | "APPROVED" | "PUBLISHED" | "ARCHIVED";

/** The five Content Types, in spec order. Contact Support is escalation, never a Content Type (AC-024). */
export const CONTENT_TYPES = ["getting-started", "how-to", "concept", "troubleshooting", "reference"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

/** Owning Workspace identifier. `general` is the platform-wide fallback level of context resolution. */
export type WorkspaceKey = "media" | "general";

/** Structured Guide body. Plain data so the same content renders in the Help Center and the drawer. */
export type GuideBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "steps"; items: { title: string; text?: string }[] }
  | { type: "list"; items: string[] }
  | { type: "note"; tone: "info" | "warning"; title?: string; text: string };

/** TH/EN localized child record of one Guide. Unique on (guideId, locale). */
export interface GuideLocale {
  guideId: string;
  locale: Locale;
  title: string;
  summary: string;
  body: GuideBlock[];
  keywords?: string[];
  publicationStatus: LifecycleStatus;
  revisionVersion: number;
  /** ISO date the published revision was last updated. */
  updatedAt: string;
}

/** Immutable canonical identity for one Help item. TH and EN are locales of the same Guide, never two Guides. */
export interface Guide {
  guideId: string;
  /** Stable public locator for direct/shared URLs. Never replaces guideId. */
  publicSlug: string;
  contentType: ContentType;
  lifecycleStatus: LifecycleStatus;
  locales: Partial<Record<Locale, GuideLocale>>;
}

/** Traceability from a Workspace Use Case to the Guides that explain it (many-to-many). */
export interface UseCaseMapping {
  workspaceKey: WorkspaceKey;
  useCaseId: string;
  guideId: string;
}

export type ContextRelationship = "PRIMARY" | "RELATED" | "TROUBLESHOOTING";

/**
 * Guide ↔ UI context. `screenKey` is required for Screen-or-more-specific mappings and left out
 * only for Workspace- or General-level fallback mappings.
 */
export interface ContextMapping {
  workspaceKey: WorkspaceKey;
  screenKey?: string;
  objectType?: string;
  action?: string;
  state?: string;
  guideId: string;
  relationshipType: ContextRelationship;
}

export interface GuideRelationship {
  sourceGuideId: string;
  targetGuideId: string;
  relationshipType: "RELATED" | "TROUBLESHOOTING";
}

/**
 * Standard HelpContext contract (D-G7-02). Every Workspace supplies the same shape; there is no
 * Workspace-specific Help integration. `returnContext` is a same-origin path and is never put in a
 * public URL (D-G8-01, AC-023).
 */
export interface HelpContext {
  workspaceKey: WorkspaceKey;
  screenKey?: string;
  objectType?: string;
  action?: string;
  state?: string;
  locale: Locale;
  returnContext?: string;
}
