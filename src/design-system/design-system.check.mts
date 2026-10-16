import assert from "node:assert";
import { readFileSync } from "node:fs";

// These files are copies of the vendored skill's `assets/` (ADR 0096): theme code here, logos in
// public/brand. They are never edited by hand: a stale or edited copy would let the app drift from
// the skill agents follow. Paths are relative to the repo root.
const SKILL = ".claude/skills/thunderone-ui/assets";
const pairs = [
  ["src/design-system/t1-tailwind-v4.css", `${SKILL}/code/tailwind/t1-tailwind-v4.css`],
  ["src/design-system/t1-icons.tsx", `${SKILL}/code/t1-icons.tsx`],
  ["public/brand/thunderone-logo-horizontal-color.svg", `${SKILL}/brand/thunderone-logo-horizontal-color.svg`],
  ["public/brand/thunderone-logo-horizontal-white.svg", `${SKILL}/brand/thunderone-logo-horizontal-white.svg`],
  ["public/brand/thunderone-mark-t1-dark.svg", `${SKILL}/brand/thunderone-mark-t1-dark.svg`],
  ["public/brand/thunderone-mark-t1-light.svg", `${SKILL}/brand/thunderone-mark-t1-light.svg`],
];

const root = new URL("../../", import.meta.url);
for (const [copy, source] of pairs) {
  const actual = readFileSync(new URL(copy, root), "utf8");
  const expected = readFileSync(new URL(source, root), "utf8");
  assert.strictEqual(actual, expected, `${copy} differs from the vendored skill — re-copy it`);
}

console.log("design-system copies match the vendored skill");
