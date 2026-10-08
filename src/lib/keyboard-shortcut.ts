// App-wide keyboard shortcuts that follow the OS: ⌘ on Apple devices, Ctrl everywhere else
// (Windows, Linux, ChromeOS). The platform is detected on the server from the request, so hints are
// right on the first paint; client components read it from `ShortcutPlatformProvider`.
//
// Matching uses the physical key (`code`) as well as the character (`key`): with a Thai keyboard
// layout active, the K key types "า" and Z types "ผ", so a `key`-only check silently ignores the
// shortcut for Thai users.

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

/** Client fallback when no provider is above: `navigator.userAgentData.platform` or the User-Agent. */
export function platformFromNavigator(nav: { userAgent: string; userAgentData?: { platform?: string } }): ShortcutPlatform {
  return APPLE.test(nav.userAgentData?.platform || nav.userAgent) ? "apple" : "other";
}

/** The modifier as printed in a `<kbd>`: "⌘" or "Ctrl". */
export const MOD_LABEL: Record<ShortcutPlatform, string> = { apple: "⌘", other: "Ctrl" };

/** The modifier for `aria-keyshortcuts`: "Meta" or "Control". */
export const MOD_ARIA: Record<ShortcutPlatform, string> = { apple: "Meta", other: "Control" };

export interface ShortcutOptions {
  shift?: boolean;
}

/** As each OS writes it: "⌘Z" / "⇧⌘Z" on Apple, "Ctrl+Z" / "Ctrl+Shift+Z" elsewhere. */
export function shortcutLabel(platform: ShortcutPlatform, letter: string, { shift = false }: ShortcutOptions = {}): string {
  const l = letter.toUpperCase();
  return platform === "apple" ? `${shift ? "⇧" : ""}⌘${l}` : `Ctrl+${shift ? "Shift+" : ""}${l}`;
}

/** For `aria-keyshortcuts`: "Meta+K", "Control+Shift+Z". */
export function shortcutAria(platform: ShortcutPlatform, letter: string, { shift = false }: ShortcutOptions = {}): string {
  return `${MOD_ARIA[platform]}+${shift ? "Shift+" : ""}${letter.toUpperCase()}`;
}

type KeyInput = Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "altKey" | "shiftKey" | "key" | "code">;

/**
 * True for ⌘+letter on Apple and Ctrl+letter elsewhere, with Shift exactly as asked. Only the
 * platform's own modifier counts: on a Mac, Ctrl+K stays "delete to end of line" in text fields.
 */
export function isModShortcut(
  event: KeyInput,
  letter: string,
  platform: ShortcutPlatform,
  { shift = false }: ShortcutOptions = {},
): boolean {
  const mod = platform === "apple" ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  if (!mod || event.altKey || event.shiftKey !== shift) return false;
  const upper = letter.toUpperCase();
  return event.code === `Key${upper}` || event.key.toUpperCase() === upper;
}

/** True for a bare "/" (any layout: the Thai layout types "ฝ" on that key). */
export function isSlashShortcut(event: KeyInput): boolean {
  if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return false;
  return event.key === "/" || event.code === "Slash";
}

/** Typing targets where a bare-key shortcut must not fire. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}
