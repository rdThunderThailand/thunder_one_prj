/**
 * Runnable check for the drawer's Related objects (ADR 0122 rule 18):
 *
 *     node src/features/media-workspace/playback-proof/playback-proof-view.check.mts
 */
import assert from "node:assert/strict";
import { relatedLinks } from "./playback-proof-view.ts";
import type { PlaybackProofEntry } from "./playback-proof-api.ts";

const entry = (channel: PlaybackProofEntry["channel"]) =>
  ({
    channel,
    device: { id: "d", name: "Box" },
    program: null,
    source: null,
    media: { id: "m", title: "Clip", in_trash: false },
  }) as PlaybackProofEntry;

const live = relatedLinks(entry({ id: "c", name: "Lobby", status: "active" }))[0];
assert.equal(live.name, "Lobby");
assert.equal(live.href, "/media-workspace/channels?channel=c");

// `deleted` missing (Core without S1+S2) behaves like a live Channel.
assert.equal(relatedLinks(entry({ id: "c", name: "Lobby", status: "active", deleted: false }))[0].name, "Lobby");

const gone = relatedLinks(entry({ id: "c", name: "Lobby", status: "inactive", deleted: true }))[0];
assert.equal(gone.name, "Lobby (deleted)");
assert.equal(gone.href, null);

console.log("playback-proof-view.check.mts — all assertions passed");
