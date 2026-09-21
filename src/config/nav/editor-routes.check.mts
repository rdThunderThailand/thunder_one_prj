/** Run: node src/config/nav/editor-routes.check.mts */
import assert from "node:assert/strict";
import { isEditorRoute } from "./editor-routes.ts";

const editors = [
  "/media-workspace/playlists/create",
  "/media-workspace/playlists/8f9125e5-a881-4099-b42d-a80a560f99c8",
  "/media-workspace/layouts/create",
  "/media-workspace/layouts/8a51df15-09e8-4608-926f-59f4ab85c205",
  "/media-workspace/layouts/templates/create",
  "/media-workspace/layouts/templates/8a51df15-09e8-4608-926f-59f4ab85c205",
];
const notEditors = [
  "/media-workspace",
  "/media-workspace/playlists",
  "/media-workspace/layouts",
  "/media-workspace/layouts/templates",
  "/media-workspace/assets/abc",
  "/media-workspace/publications/create",
  "/media-workspace/channels/abc/edit",
  "/media-workspace/playlists/abc/extra",
];

for (const p of editors) assert.equal(isEditorRoute(p), true, p);
for (const p of notEditors) assert.equal(isEditorRoute(p), false, p);
console.log("editor-routes: ok");
