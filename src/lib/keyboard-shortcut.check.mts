/** Run: node src/lib/keyboard-shortcut.check.mts */
import assert from "node:assert/strict";
import {
  isModShortcut,
  isSlashShortcut,
  isTypingTarget,
  MOD_LABEL,
  platformFromHeaders,
  platformFromNavigator,
  shortcutAria,
  shortcutLabel,
} from "./keyboard-shortcut.ts";

const h = (entries: Record<string, string>) => ({ get: (n: string) => entries[n.toLowerCase()] ?? null });
const MAC_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36";
const WIN_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36";
const LINUX_UA = "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0";
const IPAD_UA = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15";

// Platform from the request.
assert.equal(platformFromHeaders(h({ "user-agent": MAC_UA })), "apple");
assert.equal(platformFromHeaders(h({ "user-agent": IPAD_UA })), "apple");
assert.equal(platformFromHeaders(h({ "user-agent": WIN_UA })), "other");
assert.equal(platformFromHeaders(h({ "user-agent": LINUX_UA })), "other");
assert.equal(platformFromHeaders(h({ "sec-ch-ua-platform": '"Windows"', "user-agent": MAC_UA })), "other");
assert.equal(platformFromHeaders(h({ "sec-ch-ua-platform": '"macOS"' })), "apple");
assert.equal(platformFromHeaders(h({})), "other");
// …and from the browser.
assert.equal(platformFromNavigator({ userAgent: WIN_UA, userAgentData: { platform: "macOS" } }), "apple");
assert.equal(platformFromNavigator({ userAgent: WIN_UA, userAgentData: { platform: "" } }), "other");
assert.equal(platformFromNavigator({ userAgent: MAC_UA }), "apple");

// Labels as each OS writes them.
assert.equal(MOD_LABEL.apple, "⌘");
assert.equal(MOD_LABEL.other, "Ctrl");
assert.equal(shortcutLabel("apple", "z"), "⌘Z");
assert.equal(shortcutLabel("apple", "z", { shift: true }), "⇧⌘Z");
assert.equal(shortcutLabel("other", "z"), "Ctrl+Z");
assert.equal(shortcutLabel("other", "y"), "Ctrl+Y");
assert.equal(shortcutAria("apple", "k"), "Meta+K");
assert.equal(shortcutAria("other", "z", { shift: true }), "Control+Shift+Z");

const ev = (o: Partial<KeyboardEvent>) =>
  ({ metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, key: "k", code: "KeyK", ...o }) as KeyboardEvent;

// Each platform's own modifier, not the other's.
assert.equal(isModShortcut(ev({ metaKey: true }), "k", "apple"), true);
assert.equal(isModShortcut(ev({ ctrlKey: true }), "k", "other"), true);
assert.equal(isModShortcut(ev({ ctrlKey: true }), "k", "apple"), false);
assert.equal(isModShortcut(ev({ metaKey: true }), "k", "other"), false);
// Thai layout: K types "า", Z types "ผ"; the code is still KeyK / KeyZ.
assert.equal(isModShortcut(ev({ ctrlKey: true, key: "า" }), "k", "other"), true);
assert.equal(isModShortcut(ev({ metaKey: true, key: "า" }), "k", "apple"), true);
assert.equal(isModShortcut(ev({ ctrlKey: true, key: "ผ", code: "KeyZ" }), "z", "other"), true);
// Caps lock.
assert.equal(isModShortcut(ev({ ctrlKey: true, key: "K" }), "k", "other"), true);
// Shift must match exactly (undo vs redo).
assert.equal(isModShortcut(ev({ ctrlKey: true, shiftKey: true }), "k", "other"), false);
assert.equal(isModShortcut(ev({ metaKey: true, shiftKey: true, key: "Z", code: "KeyZ" }), "z", "apple", { shift: true }), true);
assert.equal(isModShortcut(ev({ metaKey: true, key: "z", code: "KeyZ" }), "z", "apple", { shift: true }), false);
// Alt and other keys don't count.
assert.equal(isModShortcut(ev({ ctrlKey: true, altKey: true }), "k", "other"), false);
assert.equal(isModShortcut(ev({ ctrlKey: true, key: "j", code: "KeyJ" }), "k", "other"), false);
assert.equal(isModShortcut(ev({}), "k", "other"), false);

// "/" on any layout, never with modifiers.
assert.equal(isSlashShortcut(ev({ key: "/", code: "Slash" })), true);
assert.equal(isSlashShortcut(ev({ key: "ฝ", code: "Slash" })), true);
assert.equal(isSlashShortcut(ev({ key: "/", code: "NumpadDivide" })), true);
assert.equal(isSlashShortcut(ev({ key: "?", code: "Slash", shiftKey: true })), false);
assert.equal(isSlashShortcut(ev({ key: "/", code: "Slash", ctrlKey: true })), false);

// Typing targets.
assert.equal(isTypingTarget({ tagName: "INPUT", isContentEditable: false } as unknown as EventTarget), true);
assert.equal(isTypingTarget({ tagName: "DIV", isContentEditable: true } as unknown as EventTarget), true);
assert.equal(isTypingTarget({ tagName: "BUTTON", isContentEditable: false } as unknown as EventTarget), false);
assert.equal(isTypingTarget(null), false);

console.log("keyboard-shortcut: ok");
