// Help Center URLs and the way back to work (F05, UC-006).
//
// The public URL only ever carries `from=<screenKey>` — never the originating path, which can hold
// object ids (D-G8-01, AC-023). The exact path is kept in sessionStorage by the drawer and read back
// here; when it is missing or does not match, the screen's list route is the fallback, and a visitor
// with no context at all gets "Go to ThunderOne" (Platform or Login, by auth state).

import { findScreenByKey } from "./screens.ts";
import type { ContentType, Locale, WorkspaceKey } from "./types";

export const HELP_BASE = "/help";
export const RETURN_STORAGE_KEY = "t1.help.return";

export interface HelpQuery {
  lang?: Locale;
  from?: string | null;
  q?: string | null;
  workspace?: WorkspaceKey | null;
  type?: ContentType | null;
}

export function helpHref(path: string, query: HelpQuery = {}): string {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.workspace) params.set("workspace", query.workspace);
  if (query.type) params.set("type", query.type);
  if (query.lang) params.set("lang", query.lang);
  if (query.from) params.set("from", query.from);
  const qs = params.toString();
  const full = path === "/" ? HELP_BASE : `${HELP_BASE}${path}`;
  return qs ? `${full}?${qs}` : full;
}

export function guideHref(slug: string, query: Pick<HelpQuery, "lang" | "from"> = {}): string {
  return helpHref(`/guides/${encodeURIComponent(slug)}`, query);
}

/** Only `from` values that name a known screen are carried forward; anything else is dropped. */
export function sanitizeFrom(value: unknown): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && findScreenByKey(v) ? v : null;
}

/** A same-origin, in-app path that is not Help itself or an auth page. */
export function isSafeReturnPath(path: unknown): path is string {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return false;
  if (path.includes("://") || [...path].some((ch) => ch.charCodeAt(0) < 32)) return false;
  const bare = path.split(/[?#]/)[0];
  if (bare === HELP_BASE || bare.startsWith(`${HELP_BASE}/`)) return false;
  return !["/login", "/register", "/set-password"].includes(bare);
}

export interface StoredReturn {
  path: string;
  screenKey?: string;
}

export function parseStoredReturn(raw: string | null): StoredReturn | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredReturn>;
    return isSafeReturnPath(value.path) ? { path: value.path, screenKey: typeof value.screenKey === "string" ? value.screenKey : undefined } : null;
  } catch {
    return null;
  }
}

export type ReturnTarget = { kind: "back"; href: string } | { kind: "go"; href: string };

/** Where the Help Center's exit button leads. */
export function returnTarget(from: string | null, stored: StoredReturn | null): ReturnTarget {
  const screen = findScreenByKey(from ?? undefined);
  if (!screen) return { kind: "go", href: "/" };
  if (stored && stored.screenKey === screen.screenKey) return { kind: "back", href: stored.path };
  return { kind: "back", href: screen.route };
}
