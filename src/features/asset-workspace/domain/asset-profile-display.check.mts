import assert from "node:assert/strict";
import { attachmentLabel, categoryDisplay, historyGroupLabel, profileWarranty } from "./asset-profile-display.mts";
import { assetActivityPageSchema } from "../services/asset-profile-contract.ts";

assert.deepEqual(categoryDisplay([]), { category: "Uncategorized", subcategory: "" });
assert.deepEqual(categoryDisplay([{ name: "Equipment" }]), { category: "Equipment", subcategory: "" });
assert.deepEqual(categoryDisplay([{ name: "IT" }, { name: "Computers" }, { name: "Laptops" }]), {
  category: "IT", subcategory: "Computers > Laptops",
});
assert.deepEqual(profileWarranty("Expired"), { label: "Expired", tone: "red" });
assert.deepEqual(profileWarranty("Expiring Soon"), { label: "Expiring Soon", tone: "yellow" });
assert.deepEqual(profileWarranty("Active"), { label: "Active", tone: "green" });
assert.deepEqual(profileWarranty(null), { label: "No warranty", tone: "zinc" });
for (const [kind, label] of Object.entries({
  registered: "Asset registered", details_edited: "Details edited", photos_updated: "Photos updated", documents_updated: "Documents updated",
})) assert.equal(historyGroupLabel(kind, null), label);
assert.equal(historyGroupLabel("other", "Transferred"), "Transferred");
assert.equal(historyGroupLabel("other", null), "Asset updated");

const event = { id: "event", action: "asset.attachment.remove", summary: "Photo removed", reason: "Damaged", file: {
  fileId: "old-photo", kind: "photo", filename: "old.jpg", mimeType: "image/jpeg", url: "https://example.test/old", thumbnailUrl: null,
} };
const page = { data: [{ id: "group", kind: "photos_updated", summary: "Photos updated", actorName: null,
  at: "2026-11-09T05:10:00Z", reason: "Damaged", events: [event] }],
page: 1, pageSize: 20, total: 1, totalPages: 1, expiresAt: "2026-11-09T06:10:00Z" };
assert.equal(assetActivityPageSchema.parse(page).data[0].events[0].file?.url, event.file.url);
// Core retains an attachment even when its legacy role/storage folder cannot identify the kind.
const unknownKind = { ...event, file: { ...event.file, kind: null } };
assert.equal(assetActivityPageSchema.parse({ ...page, data: [{ ...page.data[0], events: [unknownKind] }] }).data[0].events[0].file?.kind, null);
assert.equal(attachmentLabel("asset.attachment.remove", null), "File removed");
assert.equal(attachmentLabel("asset.attachment.add", "photo"), "Photo added");
assert.equal(assetActivityPageSchema.safeParse({ ...page, data: [{ ...page.data[0], events: undefined }] }).success, false);
assert.equal(assetActivityPageSchema.safeParse({ ...page, expiresAt: undefined }).success, false);
console.log("asset-profile display checks passed");
