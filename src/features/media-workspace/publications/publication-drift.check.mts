/** Run: node src/features/media-workspace/publications/publication-drift.check.mts */
import assert from "node:assert/strict";
import { publicationDrift, type PublicationDriftCheck } from "./publication-drift.ts";

const PUBLISHED_AT = "2026-08-27T09:00:00.000Z";

/** What a Publication published a moment ago looks like: every recorded value equals its live one. */
function settled(): PublicationDriftCheck {
  return {
    composition_revision: { recorded: 3, live: 3 },
    layout_updated_at: { recorded: PUBLISHED_AT, live: PUBLISHED_AT },
    zones: [
      { zone_name: "Main", playlist_name: "Promos", recorded_revision: 7, live_revision: 7 },
      { zone_name: "Ticker", playlist_name: "Menu", recorded_revision: 2, live_revision: 2 },
    ],
  };
}

// --- no drift ---------------------------------------------------------------

assert.deepEqual(publicationDrift({ status: "active", drift_check: settled() }), []);

// --- each level separately --------------------------------------------------

const compositionEdited = settled();
compositionEdited.composition_revision.live = 4;
assert.deepEqual(publicationDrift({ status: "active", drift_check: compositionEdited }), [
  { level: "composition" },
]);

const layoutEdited = settled();
layoutEdited.layout_updated_at.live = "2026-08-27T10:15:00.000Z";
assert.deepEqual(publicationDrift({ status: "active", drift_check: layoutEdited }), [
  { level: "layout" },
]);

// Level three: an item edited in the Playlist one Zone points at. This is the level a two-level
// check would miss, and the change an operator makes most often (ADR 0049 §11).
const playlistEdited = settled();
playlistEdited.zones[1].live_revision = 3;
assert.deepEqual(publicationDrift({ status: "active", drift_check: playlistEdited }), [
  { level: "playlist", zoneName: "Ticker", playlistName: "Menu" },
]);

// --- all three at once ------------------------------------------------------

const everythingEdited = settled();
everythingEdited.composition_revision.live = 4;
everythingEdited.layout_updated_at.live = "2026-08-27T10:15:00.000Z";
everythingEdited.zones[0].live_revision = 8;
everythingEdited.zones[1].live_revision = 3;
assert.deepEqual(publicationDrift({ status: "active", drift_check: everythingEdited }), [
  { level: "composition" },
  { level: "layout" },
  { level: "playlist", zoneName: "Main", playlistName: "Promos" },
  { level: "playlist", zoneName: "Ticker", playlistName: "Menu" },
]);

// --- a flat Publication is never flagged ------------------------------------

assert.deepEqual(publicationDrift({ status: "active", drift_check: null }), []);
assert.deepEqual(publicationDrift({ status: "active" }), []);

// --- a Publication that is not active is not flagged ------------------------

assert.deepEqual(publicationDrift({ status: "draft", drift_check: everythingEdited }), []);
assert.deepEqual(publicationDrift({ status: "cancelled", drift_check: everythingEdited }), []);

// --- a snapshot predating the drift columns never flags ---------------------

const legacySnapshot = settled();
legacySnapshot.composition_revision.recorded = null;
legacySnapshot.layout_updated_at.recorded = null;
legacySnapshot.zones = [
  { zone_name: "Main", playlist_name: "Promos", recorded_revision: null, live_revision: 7 },
];
assert.deepEqual(publicationDrift({ status: "active", drift_check: legacySnapshot }), []);

console.log("publication-drift.check.mts OK");
