/** Run: node src/features/asset-workspace/domain/asset-profile.check.mts */
import assert from "node:assert/strict";
import { fileSize, locationTrail, warrantyState } from "./asset-profile.ts";
import {
  assetDetailSchema, assetFilesSchema, assetWarrantiesSchema,
} from "../services/asset-profile-contract.ts";
import { assetRowSchema } from "../services/assets-list-types.ts";

const id = "11111111-1111-4111-8111-111111111111";

// Location path, root first; the asset's own location before Core sends the path.
assert.equal(locationTrail([{ name: "Head Office" }, { name: "Main Building" }, { name: "Lobby 1" }], { name: "Lobby 1" }),
  "Head Office › Main Building › Lobby 1");
assert.equal(locationTrail([], { name: "Lobby 1" }), "Lobby 1");
assert.equal(locationTrail([], null), "");
assert.equal(locationTrail([{ name: null }], null), "Unnamed location");

// Warranty coverage from the end date: 30-day window like the Overview attention list.
assert.deepEqual(warrantyState("2027-01-14", "2026-11-03"), { tone: "green", label: "Active" });
assert.deepEqual(warrantyState("2026-12-03", "2026-11-03"), { tone: "yellow", label: "Ends in 30 days" });
assert.deepEqual(warrantyState("2026-11-04", "2026-11-03"), { tone: "yellow", label: "Ends in 1 day" });
assert.deepEqual(warrantyState("2026-11-03", "2026-11-03"), { tone: "yellow", label: "Ends today" });
assert.deepEqual(warrantyState("2026-11-02", "2026-11-03"), { tone: "zinc", label: "Expired" });
assert.deepEqual(warrantyState(null, "2026-11-03"), { tone: "green", label: "No end date" });

assert.equal(fileSize(900), "900 B");
assert.equal(fileSize(24_000), "23 KB");
assert.equal(fileSize(1_013_880), "990 KB");
assert.equal(fileSize(2_500_000), "2.4 MB");

// Nullable fields and the current Core detail contract.
const legacy = assetDetailSchema.parse({
  id, name: "Laptop", assetTag: "AST-000011", serialNumber: null, category: null, categoryPath: [], qrValue: null, location: { id, name: "Lobby 1" },
  custody: { type: "person", id, name: "Nie Napat", avatarUrl: null, department: null }, lifecycleStatus: "Assigned", condition: "Good",
  acquisitionDate: null, registrationDate: "2026-11-03T05:10:00Z", updatedAt: "2026-11-03T05:10:00Z", notes: null,
});
assert.deepEqual(legacy.locationPath, []);
assert.equal(legacy.description, null);
assert.equal(legacy.custody?.since, null);
assert.equal(legacy.currentWarranty, null);

// Detail, files, warranties and activity as documented.
const detail = assetDetailSchema.parse({
  ...legacy, description: "Lobby display", locationPath: [{ id, name: "Head Office" }, { id, name: "Lobby 1" }],
  custody: { type: "org_unit", id, name: "IT Team", since: "2026-11-03T05:10:00Z", avatarUrl: null, department: null },
  currentWarranty: { id, provider: "Samsung", type: null, startDate: "2024-01-15", endDate: "2027-01-14", referenceNo: null, coverageNote: null, status: null, expiryStatus: "Active" },
});
assert.equal(detail.custody?.since, "2026-11-03T05:10:00Z");
assert.equal(detail.locationPath.length, 2);

const files = assetFilesSchema.parse({
  photos: [{ fileId: id, filename: "front.jpg", mimeType: "image/jpeg", sizeBytes: 1013880, uploadedAt: "2026-11-03T05:10:00Z", url: "https://x/o", thumbnailUrl: null }],
  documents: [],
  warrantyDocuments: [{ warrantyId: id, fileId: id, filename: "w.pdf", mimeType: "application/pdf", sizeBytes: 18000, uploadedAt: "2026-11-03T05:10:00Z", url: null }],
  expiresAt: "2026-11-03T06:10:00Z",
});
assert.equal(files.photos[0].thumbnailUrl, null);
assert.equal(assetFilesSchema.safeParse({ ...files, warrantyDocuments: [{ ...files.warrantyDocuments[0], warrantyId: undefined }] }).success, false);

assert.equal(assetWarrantiesSchema.parse([{ id, provider: "Old Co", type: null, startDate: null, endDate: null, referenceNo: null, coverageNote: null, status: null, isCurrent: false, createdAt: "2026-11-03T05:10:00Z" }]).length, 1);

// List rows: thumbnailUrl is optional (null or absent) and custody.since does not break parsing.
const row = {
  id, name: "Laptop", assetTag: "AST-000011", serialNumber: null, category: null, location: null,
  lifecycleStatus: "Assigned", condition: "Good", custody: { type: "person", id, name: "Nie Napat", since: "2026-11-03T05:10:00Z" },
  acquisitionDate: null, registrationDate: "2026-11-03T05:10:00Z", updatedAt: "2026-11-03T05:10:00Z", statusSince: "2026-11-03T05:10:00Z",
};
assert.equal(assetRowSchema.parse(row).thumbnail_url, null);
assert.equal(assetRowSchema.parse({ ...row, thumbnailUrl: "https://x/t" }).thumbnail_url, "https://x/t");

console.log("asset-profile checks passed");
