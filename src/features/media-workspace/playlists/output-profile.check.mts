/** Run: node src/features/playlists/output-profile.check.mts */
import assert from "node:assert/strict";
import { RESOLUTIONS, aspectRatio, parseResolution, resolutionLabel } from "./output-profile.ts";

// Every offered resolution parses back to the numbers declared beside it — the list and the
// parser cannot drift apart.
for (const { value, width, height } of RESOLUTIONS) {
  assert.deepEqual(parseResolution(value), { width, height });
}

// The three landscape options are 16:9; the portrait one is its mirror. 4K used to be labelled
// "(4K)" while the other 16:9 entries said "(16:9)" — the ratio is computed now, so it cannot.
assert.equal(aspectRatio(1920, 1080), "16:9");
assert.equal(aspectRatio(3840, 2160), "16:9");
assert.equal(aspectRatio(1280, 720), "16:9");
assert.equal(aspectRatio(1080, 1920), "9:16");

assert.equal(resolutionLabel("1920x1080"), "1920 × 1080 (16:9)");
assert.equal(resolutionLabel("3840x2160"), "3840 × 2160 (16:9)");
assert.equal(resolutionLabel("1080x1920"), "1080 × 1920 (9:16)");

// Missing or malformed values must not throw — old rows hold whatever they hold.
assert.equal(parseResolution(undefined), null);
assert.equal(parseResolution(""), null);
assert.equal(parseResolution("1920"), null);
assert.equal(parseResolution("0x1080"), null);
assert.equal(parseResolution("widthxheight"), null);
assert.equal(resolutionLabel(undefined), "—");
assert.equal(resolutionLabel(""), "—");
assert.equal(resolutionLabel("nonsense"), "nonsense");

// A resolution nobody offers still reads correctly — the profile is not a closed set at read time.
assert.equal(resolutionLabel("1024x768"), "1024 × 768 (4:3)");

console.log("output-profile.check.mts ok");
