import assert from "node:assert";
import { readFileSync } from "node:fs";

// The theme files here are copies of the vendored skill's `assets/code/` (ADR 0096). They are never
// edited by hand: a stale or edited copy would let the app drift from the skill agents follow.
const pairs = [
  ["t1-tailwind-v4.css", "tailwind/t1-tailwind-v4.css"],
  ["t1-icons.tsx", "t1-icons.tsx"],
];

for (const [copy, source] of pairs) {
  const actual = readFileSync(new URL(copy, import.meta.url), "utf8");
  const expected = readFileSync(
    new URL(`../../.claude/skills/thunderone-ui/assets/code/${source}`, import.meta.url),
    "utf8",
  );
  assert.strictEqual(actual, expected, `src/design-system/${copy} differs from the vendored skill — re-copy it`);
}

console.log("design-system copies match the vendored skill");
