const APP_ORIGIN = "http://app.invalid";

/** A same-origin path under `/media-workspace/`, or null. Anything else (other hosts, schemes, `//x`) is dropped. */
export function safeReturnTo(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.includes("\\")) return null;
  let url: URL;
  try {
    url = new URL(raw, APP_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== APP_ORIGIN || !url.pathname.startsWith("/media-workspace/")) return null;
  return url.pathname + url.search;
}
