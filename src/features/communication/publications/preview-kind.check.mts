/** Run: node src/features/publications/preview-kind.check.mts */
import assert from "node:assert/strict";
import { isVideoPreview } from "./preview-kind.ts";

const MP4 = "https://x.supabase.co/storage/v1/object/sign/media/videos/abc.mp4?token=eyJ0";
const PNG = "https://x.supabase.co/storage/v1/object/sign/media/videos/abc.png?token=eyJ0";

// 1. The asset's own kind wins whenever we have it.
assert.equal(isVideoPreview({ id: "a", kind: "video" }, PNG), true);
assert.equal(isVideoPreview({ id: "a", kind: "image" }, MP4), false);

// 2. No kind, but a mime type: trust the mime type.
assert.equal(isVideoPreview({ id: "a", file: { mime_type: "video/mp4" } }, PNG), true);
assert.equal(isVideoPreview({ id: "a", file: { mime_type: "image/png" } }, MP4), false);

// 3. No asset at all — a playlist cover is just an id, so the extension is the only
//    signal left. Getting this wrong 500s the next/image optimizer.
assert.equal(isVideoPreview(undefined, MP4), true);
assert.equal(isVideoPreview(undefined, PNG), false);

// 4. Nothing to go on: not a video, so it never reaches <video src={undefined}>.
assert.equal(isVideoPreview(undefined, undefined), false);
assert.equal(isVideoPreview({ id: "a" }, undefined), false);

console.log("preview-kind.check.mts — all assertions passed");
