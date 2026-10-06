/** Run: node src/lib/keyboard-shortcut.check.mts */
import assert from "node:assert/strict";
import { isModShortcut, MOD_LABEL, platformFromHeaders } from "./keyboard-shortcut.ts";

const h = (entries: Record<string, string>) => ({ get: (n: string) => entries[n.toLowerCase()] ?? null });
const MAC_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36";
const WIN_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36";
const LINUX_UA = "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0";
const IPAD_UA = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15";

assert.equal(platformFromHeaders(h({ "user-agent": MAC_UA })), "apple");
assert.equal(platformFromHeaders(h({ "user-agent": IPAD_UA })), "apple");
assert.equal(platformFromHeaders(h({ "user-agent": WIN_UA })), "other");
assert.equal(platformFromHeaders(h({ "user-agent": LINUX_UA })), "other");
assert.equal(platformFromHeaders(h({ "sec-ch-ua-platform": '"Windows"', "user-agent": MAC_UA })), "other");
assert.equal(platformFromHeaders(h({ "sec-ch-ua-platform": '"macOS"' })), "apple");
assert.equal(platformFromHeaders(h({})), "other");
assert.equal(MOD_LABEL.apple, "⌘");
assert.equal(MOD_LABEL.other, "Ctrl");

const ev = (o: Partial<KeyboardEvent>) =>
  ({ metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, key: "k", code: "KeyK", ...o }) as KeyboardEvent;

// Each platform's own modifier.
assert.equal(isModShortcut(ev({ metaKey: true }), "k", "apple"), true);
assert.equal(isModShortcut(ev({ ctrlKey: true }), "k", "other"), true);
// Not the other platform's.
assert.equal(isModShortcut(ev({ ctrlKey: true }), "k", "apple"), false);
assert.equal(isModShortcut(ev({ metaKey: true }), "k", "other"), false);
// Thai layout: the K key types "า" but its code is still KeyK.
assert.equal(isModShortcut(ev({ ctrlKey: true, key: "า" }), "k", "other"), true);
assert.equal(isModShortcut(ev({ metaKey: true, key: "า" }), "k", "apple"), true);
// Caps lock / uppercase.
assert.equal(isModShortcut(ev({ ctrlKey: true, key: "K" }), "k", "other"), true);
// Extra modifiers and other keys don't count.
assert.equal(isModShortcut(ev({ ctrlKey: true, shiftKey: true }), "k", "other"), false);
assert.equal(isModShortcut(ev({ ctrlKey: true, altKey: true }), "k", "other"), false);
assert.equal(isModShortcut(ev({ ctrlKey: true, key: "j", code: "KeyJ" }), "k", "other"), false);
assert.equal(isModShortcut(ev({}), "k", "other"), false);

console.log("keyboard-shortcut: ok");
