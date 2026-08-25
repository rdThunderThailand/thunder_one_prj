/**
 * Runnable check for the unapproved-asset guard:
 *
 *     node src/features/publications/unapproved-assets.check.mts
 *
 * `media_publication_set_content` rejects a save containing any asset that is not
 * `approved`, which used to strand the draft: the bad pick persisted, so every
 * later save retried the same rejected RPC. These assertions cover the two halves
 * of the fix — dropping the bad item, and not wiping items we cannot judge.
 */
import assert from "node:assert/strict";
import { dropUnapprovedItems, isApprovedAsset } from "./draft-mapping.ts";
import { classifyApiError } from "../../../lib/api/api-error.ts";
import type { DraftAssetItem, MediaAsset } from "./types/index.ts";

function asset(id: string, approval_status: string): MediaAsset {
  return { id, kind: "image", approval_status } as MediaAsset;
}

const item = (media_asset_id: string): DraftAssetItem => ({
  media_asset_id,
  duration_seconds: 10,
});

// 1. Only "approved" counts — "draft"/"pending" are the values the RPC refuses.
assert.equal(isApprovedAsset(asset("a", "approved")), true);
assert.equal(isApprovedAsset(asset("a", "draft")), false);
assert.equal(isApprovedAsset(asset("a", "pending")), false);

// 2. An unapproved pick is dropped, an approved one survives.
assert.deepEqual(
  dropUnapprovedItems([item("ok"), item("bad")], [asset("ok", "approved"), asset("bad", "draft")]),
  [item("ok")]
);

// 3. An item whose asset is absent from the library is KEPT — a failed or partial
//    load must not silently wipe a selection that may well be valid.
assert.deepEqual(dropUnapprovedItems([item("ok")], []), [item("ok")]);

// 4. Nothing to drop means the same items back.
const clean = [item("a"), item("b")];
assert.deepEqual(
  dropUnapprovedItems(clean, [asset("a", "approved"), asset("b", "approved")]),
  clean
);

// 5. The raw RPC wording never reaches the user.
const classified = classifyApiError(
  new Error("Invalid input: 1 media asset(s) are not approved"),
  "fallback"
);
assert.equal(classified.kind, "rejected");
assert.ok(!classified.message.includes("Invalid input"), "raw DB wording leaked to the UI");
assert.ok(classified.message.includes("อนุมัติ"), "message should tell the user what to do");

// 6. The unapproved case keeps its specific wording — the generic "Invalid input:"
//    fallback must not swallow it, since both share that prefix.
const generic = classifyApiError(
  new Error("Invalid input: Too small: expected string to have >=1 characters"),
  "fallback"
);
assert.equal(generic.kind, "rejected");
assert.ok(!generic.message.includes("Invalid input"), "raw schema wording leaked to the UI");
assert.notEqual(generic.message, classified.message, "generic fallback shadowed the approval case");

console.log("unapproved-assets.check.mts — all assertions passed");
