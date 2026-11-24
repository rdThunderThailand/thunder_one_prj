import type { PublicationListParams } from "./types";

/** `?a=b&…` for `GET /media/publications`, or "" when nothing is set. Blank values are dropped
 *  so the backend never sees an empty `search` it would reject or an empty id it would fail on. */
export function buildPublicationListQuery(params: PublicationListParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text !== "") query.set(key, text);
  }
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}
