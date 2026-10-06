// The "mod" key for app-wide shortcuts: ⌘ on Apple devices, Ctrl everywhere else (Windows, Linux,
// ChromeOS). Detected on the server from the request so the hint is right on the first paint.
//
// Matching uses the physical key (`code`) as well as the character (`key`): with a Thai keyboard
// layout active, the K key types "า", so a `key`-only check silently ignores Ctrl+K for Thai users.

export type ShortcutPlatform = "apple" | "other";

const APPLE = /mac|iphone|ipad|ipod/i;

/**
 * From request headers: `Sec-CH-UA-Platform` ("macOS", "Windows"; Chromium only) when present, else
 * the User-Agent. iPadOS Safari reports a Mac User-Agent, which is still Apple — correct here.
 */
export function platformFromHeaders(headers: { get(name: string): string | null }): ShortcutPlatform {
  const hint = headers.get("sec-ch-ua-platform");
  const source = hint ?? headers.get("user-agent") ?? "";
  return APPLE.test(source) ? "apple" : "other";
}

/** What to print in a `<kbd>`: "⌘ K" or "Ctrl K". */
export const MOD_LABEL: Record<ShortcutPlatform, string> = { apple: "⌘", other: "Ctrl" };

/** For `aria-keyshortcuts`: "Meta+K" or "Control+K". */
export const MOD_ARIA: Record<ShortcutPlatform, string> = { apple: "Meta", other: "Control" };

type KeyInput = Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "altKey" | "shiftKey" | "key" | "code">;

/**
 * True for ⌘K on Apple and Ctrl+K elsewhere. Only the platform's own modifier counts: on a Mac,
 * Ctrl+K stays "delete to end of line" in text fields.
 */
export function isModShortcut(event: KeyInput, letter: string, platform: ShortcutPlatform): boolean {
  const mod = platform === "apple" ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  if (!mod || event.altKey || event.shiftKey) return false;
  const upper = letter.toUpperCase();
  return event.code === `Key${upper}` || event.key.toUpperCase() === upper;
}
