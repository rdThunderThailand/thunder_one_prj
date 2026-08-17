/**
 * Runnable check for the upload format gate:
 *
 *     node src/features/publications/upload-limits.check.mts
 *
 * The library already holds a 27MB `video/quicktime` file that no transcoding step
 * will ever normalise, so the gate has to hold at the picker. These assertions cover
 * the accepted set, the rejection message split (video vs everything else), and the
 * empty-`File.type` fallback that made the bad file slip through in the first place.
 */
import assert from "node:assert/strict";
import { rejectUploadReason } from "./upload-limits.ts";

const file = (name: string, type: string) => ({ name, type });

// Accepted formats pass.
for (const [name, type] of [
  ["clip.mp4", "video/mp4"],
  ["shot.png", "image/png"],
  ["shot.jpg", "image/jpeg"],
  ["shot.webp", "image/webp"],
] as const) {
  assert.equal(rejectUploadReason(file(name, type)), null, `${type} should be accepted`);
}

// The format that is actually in the library gets the convert-first message.
const movReason = rejectUploadReason(file("clip.mov", "video/quicktime"));
assert.ok(movReason?.includes("MP4"), "quicktime should be told to convert to MP4");

// Non-video gets the generic message, not the convert-first one.
const pdfReason = rejectUploadReason(file("deck.pdf", "application/pdf"));
assert.ok(pdfReason, "pdf should be rejected");
assert.ok(!pdfReason.includes("แปลงไฟล์"), "pdf should not get the video convert message");

// Empty File.type falls back to the extension in both directions.
assert.equal(rejectUploadReason(file("clip.MP4", "")), null, "extension fallback should accept mp4");
assert.ok(rejectUploadReason(file("clip.mov", "")), "extension fallback should reject mov");
assert.ok(rejectUploadReason(file("noextension", "")), "unknown file should be rejected");

console.log("upload-limits: all checks passed");
