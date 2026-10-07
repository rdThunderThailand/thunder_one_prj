/** Run: node src/features/help/navigation.check.mts — HelpContext from routes and the way back (F05, UC-006, AC-023). */
import assert from "node:assert/strict";
import { guideHref, helpHref, isSafeReturnPath, parseStoredReturn, returnTarget, sanitizeFrom } from "./navigation.ts";
import { HELP_SCREENS, findScreen, helpContextFromPathname } from "./screens.ts";

const uuid = "8f9125e5-a881-4099-b42d-a80a560f99c8";

// Route → screen.
const cases: [string, string | null][] = [
  ["/media-workspace", "media.overview"],
  ["/media-workspace/playlists", "media.playlists"],
  [`/media-workspace/playlists/${uuid}`, "media.playlist-editor"],
  ["/media-workspace/playlists/create", "media.playlist-editor"],
  ["/media-workspace/assets", "media.assets"],
  ["/media-workspace/assets/upload", "media.assets.upload"],
  [`/media-workspace/assets/${uuid}`, "media.asset-detail"],
  ["/media-workspace/layouts", "media.layouts"],
  ["/media-workspace/layouts/templates", "media.templates"],
  [`/media-workspace/layouts/templates/${uuid}`, "media.templates"],
  [`/media-workspace/layouts/${uuid}`, "media.layout-editor"],
  ["/media-workspace/program", "media.programs"],
  ["/media-workspace/program/create", "media.program-create"],
  [`/media-workspace/program/${uuid}/edit`, "media.program-detail"],
  ["/media-workspace/now-next", "media.now-next"],
  ["/media-workspace/channels", "media.channels"],
  [`/media-workspace/channels/${uuid}/edit`, "media.channel-edit"],
  ["/media-workspace/channel-groups", "media.channel-groups"],
  ["/people/personnel", null],
  ["/mission-control", null],
];
for (const [path, key] of cases) assert.equal(findScreen(path)?.screenKey ?? null, key, path);

assert.equal(new Set(HELP_SCREENS.map((s) => s.screenKey)).size, HELP_SCREENS.length, "screen keys unique");
for (const s of HELP_SCREENS) assert.ok(!/[0-9a-f]{8}-/.test(s.route), `${s.screenKey} fallback route has no object id`);

// Standard contract: same shape everywhere, General outside the pilot.
const ctx = helpContextFromPathname(`/media-workspace/playlists/${uuid}`, "en");
assert.deepEqual(ctx, { workspaceKey: "media", screenKey: "media.playlist-editor", objectType: "playlist", locale: "en", returnContext: `/media-workspace/playlists/${uuid}` });
assert.equal(helpContextFromPathname("/people", "th").workspaceKey, "general");
assert.equal(helpContextFromPathname("/media-workspace/something-new", "th").workspaceKey, "media");

// Public URLs carry the screen key, never the path or an object id (AC-023).
const href = guideHref("create-a-playlist", { lang: "en", from: "media.playlist-editor" });
assert.equal(href, "/help/guides/create-a-playlist?lang=en&from=media.playlist-editor");
assert.ok(!href.includes(uuid));
assert.equal(helpHref("/"), "/help");
assert.equal(helpHref("/search", { q: "เพลย์ลิสต์", lang: "th" }), `/help/search?q=${encodeURIComponent("เพลย์ลิสต์")}&lang=th`);
assert.equal(sanitizeFrom("media.playlists"), "media.playlists");
assert.equal(sanitizeFrom(`/media-workspace/playlists/${uuid}`), null);
assert.equal(sanitizeFrom(["media.channels"]), "media.channels");

// Return path safety.
for (const ok of ["/media-workspace/playlists", `/media-workspace/playlists/${uuid}?tab=items`]) assert.ok(isSafeReturnPath(ok), ok);
for (const bad of ["//evil.example", "https://evil.example", "/\\evil", "/help", "/help/guides/x", "/login", "javascript:alert(1)", "/a\nb", 42, null]) {
  assert.equal(isSafeReturnPath(bad), false, String(bad));
}
assert.equal(parseStoredReturn("not json"), null);
assert.equal(parseStoredReturn(JSON.stringify({ path: "//evil" })), null);
assert.deepEqual(parseStoredReturn(JSON.stringify({ path: "/media-workspace/playlists", screenKey: "media.playlists" })), { path: "/media-workspace/playlists", screenKey: "media.playlists" });

// AC-011: exact path when the session still has it; screen route otherwise; Go to ThunderOne for a public visitor.
const stored = { path: `/media-workspace/playlists/${uuid}`, screenKey: "media.playlist-editor" };
assert.deepEqual(returnTarget("media.playlist-editor", stored), { kind: "back", href: stored.path });
assert.deepEqual(returnTarget("media.playlist-editor", null), { kind: "back", href: "/media-workspace/playlists" });
assert.deepEqual(returnTarget("media.playlists", stored), { kind: "back", href: "/media-workspace/playlists" }, "stale session path is not reused for another screen");
assert.deepEqual(returnTarget(null, stored), { kind: "go", href: "/" });
assert.deepEqual(returnTarget("nonsense", null), { kind: "go", href: "/" });

console.log("help navigation: ok");
