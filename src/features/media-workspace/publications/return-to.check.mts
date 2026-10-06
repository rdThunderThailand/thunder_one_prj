/**
 * Runnable check for the Program editor's `returnTo` guard:
 *
 *     node src/features/media-workspace/publications/return-to.check.mts
 */
import assert from "node:assert/strict";
import { safeReturnTo } from "./return-to.ts";

assert.equal(safeReturnTo("/media-workspace/now-next?group=g1"), "/media-workspace/now-next?group=g1");
assert.equal(safeReturnTo("/media-workspace/calendar?date=2026-10-06&channel=c1"), "/media-workspace/calendar?date=2026-10-06&channel=c1");
assert.equal(safeReturnTo("/media-workspace/now-next#x"), "/media-workspace/now-next");

for (const bad of [null, "", "/", "/overview", "/media-workspace", "//evil.com/media-workspace/x", "https://evil.com/media-workspace/x", "javascript:alert(1)", "/media-workspace\\..\\x", "/\\evil.com", "media-workspace/x"]) {
  assert.equal(safeReturnTo(bad), null, `should reject ${bad}`);
}
console.log("return-to.check: ok");
