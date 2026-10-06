/** Run: node src/features/help/repository.check.mts — the Help Spec §7 rules that live in data, not UI. */
import assert from "node:assert/strict";
import {
  browseGuides,
  deliverGuide,
  facets,
  helpData,
  isPublic,
  relatedGuides,
  resolveContext,
  resolveLocale,
  searchGuides,
} from "./repository.ts";
import { CONTENT_TYPES, type Guide } from "./types.ts";

const ids = (cards: { guideId: string }[]) => cards.map((c) => c.guideId);
const allPublicIds = new Set(helpData.guides.filter((g) => isPublic(g, "th") || isPublic(g, "en")).map((g) => g.guideId));

// Data integrity: unique ids/slugs, locale records point at their parent, mappings resolve.
{
  const guideIds = helpData.guides.map((g) => g.guideId);
  assert.equal(new Set(guideIds).size, guideIds.length, "guideId unique");
  assert.equal(new Set(helpData.guides.map((g) => g.publicSlug)).size, guideIds.length, "publicSlug unique");
  for (const g of helpData.guides) {
    for (const [locale, l] of Object.entries(g.locales)) {
      assert.equal(l?.guideId, g.guideId, `${g.guideId}/${locale} parent`);
      assert.equal(l?.locale, locale, `${g.guideId}/${locale} key`);
    }
    assert.ok(CONTENT_TYPES.includes(g.contentType), `${g.guideId} content type`);
  }
  for (const m of helpData.contextMappings) assert.ok(guideIds.includes(m.guideId), `context mapping → ${m.guideId}`);
  for (const r of helpData.relationships) {
    assert.ok(guideIds.includes(r.sourceGuideId) && guideIds.includes(r.targetGuideId), `relationship ${r.sourceGuideId}→${r.targetGuideId}`);
  }
  for (const id of helpData.recommendedGuideIds) assert.ok(allPublicIds.has(id), `recommended ${id} is public`);
}

// AC-002 exact mapping; AC-003 fallback Exact → Screen → Workspace → General.
{
  const exact = resolveContext(helpData, { workspaceKey: "media", screenKey: "media.playlist-editor", objectType: "playlist", locale: "th" });
  assert.equal(exact.level, "exact");
  assert.deepEqual(ids(exact.primary), ["GDE-0002"]);
  assert.ok(ids(exact.related).includes("GDE-0003"));
  assert.ok(ids(exact.troubleshooting).includes("GDE-0009"));

  const screen = resolveContext(helpData, { workspaceKey: "media", screenKey: "media.playlists", locale: "th" });
  assert.equal(screen.level, "screen");
  assert.deepEqual(ids(screen.primary), ["GDE-0002"]);

  // A qualifier with no Exact mapping on a mapped screen falls to Screen.
  const screenFallback = resolveContext(helpData, { workspaceKey: "media", screenKey: "media.playlists", objectType: "playlist", action: "edit", locale: "th" });
  assert.equal(screenFallback.level, "screen");

  // A screen whose only PRIMARY is not public (Channel Groups → IN REVIEW Guide) falls to Workspace.
  const workspace = resolveContext(helpData, { workspaceKey: "media", screenKey: "media.channel-groups", locale: "th" });
  assert.equal(workspace.level, "workspace");
  assert.deepEqual(ids(workspace.primary), ["GDE-0001"]);

  const unmapped = resolveContext(helpData, { workspaceKey: "media", screenKey: "media.not-a-screen", locale: "en" });
  assert.equal(unmapped.level, "workspace");

  const general = resolveContext(helpData, { workspaceKey: "general", locale: "th" });
  assert.equal(general.level, "general");
  assert.deepEqual(ids(general.primary), ["GDE-0010"]);

  // No section ever lists a Guide twice or a non-public Guide.
  for (const r of [exact, screen, workspace, general]) {
    const all = [...ids(r.primary), ...ids(r.related), ...ids(r.troubleshooting)];
    assert.equal(new Set(all).size, all.length, `no duplicates at ${r.level}`);
    for (const id of all) assert.ok(allPublicIds.has(id), `${id} public at ${r.level}`);
  }

  // Resolution never fails, even with nothing mapped.
  const empty = resolveContext({ ...helpData, contextMappings: [] }, { workspaceKey: "media", screenKey: "media.playlists", locale: "th" });
  assert.equal(empty.level, "none");
}

// AC-004 search in active locale; F02 relevance Title > Summary > Keywords > Body; AC-005 zero result is just empty.
{
  const th = searchGuides(helpData, "เพลย์ลิสต์", "th");
  assert.equal(th[0]?.guideId, "GDE-0002", "title match ranks first");
  assert.ok(th.every((c) => c.inRequestedLocale));

  const en = searchGuides(helpData, "playlist", "en");
  assert.equal(en[0]?.guideId, "GDE-0002");
  assert.ok(!ids(en).includes("GDE-0012"), "archived never found");

  // EN of GDE-0007 is DRAFT: searchable in TH, not in EN.
  assert.ok(ids(searchGuides(helpData, "playback stale", "th")).includes("GDE-0007"));
  assert.ok(!ids(searchGuides(helpData, "playback stale", "en")).includes("GDE-0007"));

  assert.deepEqual(searchGuides(helpData, "zzzz-nothing", "en"), []);
  assert.deepEqual(searchGuides(helpData, "   ", "th"), [], "empty query is not a search");

  const filtered = searchGuides(helpData, "program", "en", { contentType: "troubleshooting" });
  assert.ok(filtered.length > 0 && filtered.every((c) => c.contentType === "troubleshooting"));
}

// AC-006 browse Media by each of the five Content Types; AC-022 filtering never duplicates identity.
{
  const media = browseGuides(helpData, "th", { workspace: "media" });
  assert.equal(new Set(ids(media)).size, media.length);
  for (const type of CONTENT_TYPES) {
    const byType = browseGuides(helpData, "th", { workspace: "media", contentType: type });
    assert.ok(byType.every((c) => c.contentType === type && c.workspaces.includes("media")), type);
  }
  const f = facets(helpData, "th", { workspace: "media" });
  assert.deepEqual(f.contentTypes.map((c) => c.key), [...CONTENT_TYPES], "five Content Types, spec order");
  const sum = f.contentTypes.reduce((n, c) => n + c.count, 0);
  assert.equal(sum, media.length, "each Guide counted once across types");
}

// AC-007/008/015 delivery; AC-009 same Guide ID across locales; AC-010 missing locale is reported, not substituted.
{
  const th = deliverGuide(helpData, "create-a-playlist", "th");
  const en = deliverGuide(helpData, "create-a-playlist", "en");
  assert.ok(th.kind === "ok" && en.kind === "ok");
  assert.equal(th.guide.guideId, en.guide.guideId);
  assert.equal(th.content.locale, "th");
  assert.equal(en.content.locale, "en");

  const missing = deliverGuide(helpData, "now-next-playback-states", "en");
  assert.equal(missing.kind, "locale-unavailable");
  assert.ok(missing.kind === "locale-unavailable" && missing.available.join() === "th");

  assert.equal(deliverGuide(helpData, "channel-group-playback-mode", "th").kind, "unavailable", "IN REVIEW not public");
  assert.equal(deliverGuide(helpData, "publish-from-playlist-page", "th").kind, "unavailable", "ARCHIVED not public");
  assert.ok(helpData.guides.some((g) => g.publicSlug === "publish-from-playlist-page"), "ARCHIVED kept, not hard deleted");
  assert.equal(deliverGuide(helpData, "no-such-guide", "th").kind, "unavailable");

  // Locale-level independence: a PUBLISHED locale on a non-PUBLISHED Guide is still not public.
  const g: Guide = { ...helpData.guides[1], lifecycleStatus: "APPROVED" };
  assert.equal(isPublic(g, "th"), false);
}

// AC-021 related/troubleshooting show public Guides only.
{
  const r = relatedGuides(helpData, "GDE-0002", "th");
  assert.ok(!ids(r.related).includes("GDE-0012"), "archived related dropped");
  assert.ok(ids(r.related).includes("GDE-0004"));
  assert.ok(ids(r.troubleshooting).includes("GDE-0009"));
  const r4 = relatedGuides(helpData, "GDE-0004", "en");
  assert.ok(!ids(r4.related).includes("GDE-0011"), "in-review related dropped");
  // GDE-0007 has no public EN; it may appear but must say so.
  const c7 = r4.related.find((c) => c.guideId === "GDE-0007");
  assert.ok(c7 && c7.inRequestedLocale === false && c7.shownLocale === "th");
}

// Locale resolution.
assert.equal(resolveLocale("en"), "en");
assert.equal(resolveLocale(["en", "th"]), "en");
assert.equal(resolveLocale("fr"), "th");
assert.equal(resolveLocale(undefined), "th");

console.log("help repository: ok");
