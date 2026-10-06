// Reading Help Center URL state. Every page takes the same params; unknown values are dropped
// rather than trusted, so a hand-edited URL can only ever narrow to a valid view.

import { helpHref, sanitizeFrom, type HelpQuery } from "./navigation.ts";
import { parseContentType, resolveLocale } from "./repository.ts";
import { LOCALES, type ContentType, type Locale, type WorkspaceKey } from "./types.ts";

export type SearchParams = Record<string, string | string[] | undefined>;

export interface HelpParams {
  locale: Locale;
  from: string | null;
  q: string;
  workspace: WorkspaceKey | null;
  type: ContentType | null;
}

const WORKSPACES: WorkspaceKey[] = ["media", "general"];

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function readHelpParams(sp: SearchParams): HelpParams {
  const workspace = first(sp.workspace);
  return {
    locale: resolveLocale(sp.lang),
    from: sanitizeFrom(sp.from),
    q: (first(sp.q) ?? "").trim().slice(0, 200),
    workspace: WORKSPACES.includes(workspace as WorkspaceKey) ? (workspace as WorkspaceKey) : null,
    type: parseContentType(sp.type),
  };
}

/** The same Help page in each locale (UC-007: switching language keeps the reader on the same page). */
export function localeHrefs(path: string, params: HelpParams, extra: Partial<HelpQuery> = {}): Record<Locale, string> {
  const base: HelpQuery = { q: params.q || null, workspace: params.workspace, type: params.type, from: params.from, ...extra };
  return Object.fromEntries(LOCALES.map((l) => [l, helpHref(path, { ...base, lang: l })])) as Record<Locale, string>;
}
