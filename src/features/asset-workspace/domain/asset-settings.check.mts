/** Run: node src/features/asset-workspace/domain/asset-settings.check.mts */
import assert from "node:assert/strict";
import { dueDaysError, prefixError, previewNextTag, sameIds } from "./asset-settings.ts";

// Prefix: 2-8 of A-Z / 0-9 after trim and upper-casing (05 §4.12.1, R1).
for (const ok of ["AST", "ab", " itx ", "A1B2C3D4"]) assert.equal(prefixError(ok), null, ok);
for (const bad of ["", "  ", "A", "ABCDEFGHI", "AB-CD", "AB CD", "ÅB", "A_B"]) assert.notEqual(prefixError(bad), null, bad);

// Due days: whole number 1..365.
for (const ok of ["1", "14", "365", " 30 "]) assert.equal(dueDaysError(ok), null, ok);
for (const bad of ["", "0", "366", "1.5", "-1", "abc", "1e2", "0014x"]) assert.notEqual(dueDaysError(bad), null, bad);

// Preview keeps the counter: only the prefix part changes, never the number (R1).
assert.equal(previewNextTag("AST-000124", "itx"), "ITX-000124");
assert.equal(previewNextTag("AST-000124", " "), "…-000124");
assert.equal(previewNextTag(null, "ITX"), null, "all numbers used");

assert.ok(sameIds(["a", "b"], ["b", "a"]));
assert.ok(!sameIds(["a"], ["a", "b"]));
assert.ok(sameIds([], []));

console.log("asset-settings.check ok");
