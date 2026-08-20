/**
 * Runnable Channel request-contract check:
 *
 *     node src/features/channels/services/channels-api-contract.check.mts
 */
import assert from "node:assert/strict";
import {
  buildChannelListPath,
  buildCreateChannelBody,
  buildUpdateChannelBody,
} from "./channels-api.ts";
import type { ChannelDraftInput } from "../types/index.ts";

const draft: ChannelDraftInput = {
  name: "Central World Menu Boards",
  description: "Menu boards for in-store promotions",
  category: "in_store",
  channel_type_id: "type-menu-board",
  location_id: "location-central-world",
  device_ids: ["screen-1", "screen-2"],
  expected_orientation: "landscape",
  expected_resolution: "1920x1080",
  default_playlist_id: "playlist-kfc-wednesday",
};

// A wrong query key or order would make filtering silently diverge from the future API contract.
assert.deepEqual(
  buildChannelListPath({ category: "in_store", lifecycle: "active" }),
  "/media/channels?category=in_store&lifecycle=active",
);

// The backend accepts channel_category (not the UI's category field) and creates drafts itself.
assert.deepEqual(buildCreateChannelBody(draft), {
  name: "Central World Menu Boards",
  description: "Menu boards for in-store promotions",
  channel_category: "in_store",
  channel_type_id: "type-menu-board",
  location_id: "location-central-world",
  device_ids: ["screen-1", "screen-2"],
  expected_orientation: "landscape",
  expected_resolution: "1920x1080",
  default_playlist_id: "playlist-kfc-wednesday",
});

// Dropping the loaded revision would disable the required optimistic-lock protection.
assert.equal(buildUpdateChannelBody(draft, 7).expected_revision, 7);

console.log("channels-api-contract.check.mts — all assertions passed");
