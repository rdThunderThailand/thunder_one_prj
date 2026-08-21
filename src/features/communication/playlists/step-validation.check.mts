import assert from "node:assert";
import { validateStep, canSubmit, validateBasicInfo, PLAYLIST_LIMITS } from "./step-validation.ts";

// Empty name still fails step 1 — the one rule that survived the uniqueness removal.
{
  const result = validateStep(1, { name: "", items: [], playback: {} });
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes("ตั้งชื่อ playlist ก่อน"));
}

// A duplicate-looking name (same string used twice) is no longer rejected — this is the
// behavior change this task exists to make, so assert it directly rather than just
// asserting the old rejection is gone.
{
  const result = validateStep(1, { name: "Lobby Loop", items: [], playback: {} });
  assert.strictEqual(result.valid, true);
}

// canSubmit requires step 2's item rule too.
{
  assert.strictEqual(canSubmit({ name: "Lobby Loop", items: [], playback: {} }), false);
  assert.strictEqual(
    canSubmit({
      name: "Lobby Loop",
      items: [{ mediaAssetId: "a", transition: "cut", durationSeconds: null }],
      playback: {},
    }),
    true
  );
}

// step 3: a supported playback value passes.
{
  const result = validateStep(3, { name: "Lobby Loop", items: [], playback: { playMode: "sequential" } });
  assert.strictEqual(result.valid, true);
}

// step 3: an unsupported play_mode blocks Next.
{
  const result = validateStep(3, {
    name: "Lobby Loop",
    items: [],
    playback: { playMode: "backwards" as never },
  });
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Play Mode")));
}

// step 3: an unsupported repeat blocks Next.
{
  const result = validateStep(3, {
    name: "Lobby Loop",
    items: [],
    playback: { repeat: "sometimes" as never },
  });
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Repeat")));
}

// step 3: an unsupported start_from blocks Next.
{
  const result = validateStep(3, {
    name: "Lobby Loop",
    items: [],
    playback: { startFrom: "middle" as never },
  });
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Start Playback From")));
}

{
  const errors = validateBasicInfo({ name: "Lobby Loop", description: "" });
  assert.deepEqual(errors, {});
}
{
  const errors = validateBasicInfo({ name: "" });
  assert.strictEqual(errors.name, "ตั้งชื่อ playlist ก่อน");
}
{
  const errors = validateBasicInfo({ name: "   " });
  assert.strictEqual(errors.name, "ตั้งชื่อ playlist ก่อน");
}
{
  const nameOfLimit = "a".repeat(PLAYLIST_LIMITS.nameMax);
  const errors = validateBasicInfo({ name: nameOfLimit });
  assert.strictEqual(errors.name, undefined);
}
{
  const nameOverLimit = "a".repeat(PLAYLIST_LIMITS.nameMax + 1);
  const errors = validateBasicInfo({ name: nameOverLimit });
  assert.strictEqual(errors.name, `ชื่อยาวเกิน ${PLAYLIST_LIMITS.nameMax} ตัวอักษร`);
}
{
  const descOverLimit = "a".repeat(PLAYLIST_LIMITS.descriptionMax + 1);
  const errors = validateBasicInfo({ name: "Valid", description: descOverLimit });
  assert.strictEqual(errors.description, `คำอธิบายยาวเกิน ${PLAYLIST_LIMITS.descriptionMax} ตัวอักษร`);
}
{
  const descAtLimit = "a".repeat(PLAYLIST_LIMITS.descriptionMax);
  const errors = validateBasicInfo({ name: "Valid", description: descAtLimit });
  assert.strictEqual(errors.description, undefined);
}
{
  const result = validateStep(1, { name: "", items: [], playback: {} });
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.includes("ตั้งชื่อ playlist ก่อน"));
}

console.log("step-validation.check.mts OK");
