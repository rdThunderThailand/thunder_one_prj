import assert from "node:assert/strict";
import { categoryDisplay, filterFileRows, historyDateRange, historyEventType, lifecycleStepEntry, lifecycleSteps, profileFileRows, profileWarranty, warrantyRemaining } from "./asset-profile-display.mts";
import { assetHistoryPageSchema } from "../services/asset-profile-contract.ts";

assert.deepEqual(categoryDisplay([]), { category: "Uncategorized", subcategory: "" });
assert.deepEqual(categoryDisplay([{ name: "Equipment" }]), { category: "Equipment", subcategory: "" });
assert.deepEqual(categoryDisplay([{ name: "IT" }, { name: "Computers" }, { name: "Laptops" }]), {
  category: "IT", subcategory: "Computers > Laptops",
});
assert.deepEqual(profileWarranty("Expired"), { label: "Expired", tone: "red" });
assert.deepEqual(profileWarranty("Expiring Soon"), { label: "Expiring Soon", tone: "yellow" });
assert.deepEqual(profileWarranty("Active"), { label: "Active", tone: "green" });
assert.deepEqual(profileWarranty(null), { label: "No warranty", tone: "zinc" });
assert.deepEqual(historyEventType("assign"), { id: "assign", label: "Assignment", tone: "blue" });
assert.equal(historyEventType("import").label, "Other");
assert.deepEqual(historyDateRange("today", "2026-11-12"), { from: "2026-11-12", to: "2026-11-12" });
assert.deepEqual(historyDateRange("7d", "2026-03-02"), { from: "2026-02-24", to: "2026-03-02" });
assert.deepEqual(historyDateRange("30d", "2026-01-10"), { from: "2025-12-12", to: "2026-01-10" });
assert.deepEqual(historyDateRange("year", "2026-11-12"), { from: "2026-01-01", to: "2026-11-12" });
const historyRow = { id: "e", at: "2026-11-12T03:00:00Z", eventType: "location", action: "asset.location.move",
  summary: "Moved to Repair Bench", from: null, to: "Repair Bench", reason: null, actorName: null };
const historyPage = { data: [historyRow], page: 1, pageSize: 20, total: 1, totalPages: 1 };
assert.equal(assetHistoryPageSchema.parse(historyPage).data[0].from, null);
assert.equal(assetHistoryPageSchema.safeParse({ ...historyPage, data: [{ ...historyRow, from: undefined }] }).success, false);
assert.deepEqual(lifecycleSteps("Available"), ["Current", "Not Started", "Not Started", "Not Started"]);
assert.deepEqual(lifecycleSteps("In Maintenance"), ["Completed", "Current", "Not Started", "Not Started"]);
assert.deepEqual(lifecycleSteps("Disposed"), ["Completed", "Completed", "Completed", "Current"]);
assert.deepEqual(lifecycleSteps("In Use"), ["Not Started", "Not Started", "Not Started", "Not Started"]);
const base = { mimeType: "application/pdf", sizeBytes: 1, url: null, uploadedBy: null };
const fileRows = profileFileRows({
  photos: [{ ...base, fileId: "p", filename: "front.jpg", mimeType: "image/jpeg", uploadedAt: "2026-11-02T00:00:00Z", thumbnailUrl: null }],
  documents: [{ ...base, fileId: "d", filename: "Invoice.pdf", uploadedAt: "2026-11-03T00:00:00Z", uploadedBy: { id: "u", name: "Jane" } }],
  warrantyDocuments: [{ ...base, fileId: "w", filename: "care.xlsx", mimeType: "application/vnd.ms-excel", uploadedAt: "2026-11-01T00:00:00Z", warrantyId: "x" }],
  expiresAt: "2026-11-03T01:00:00Z",
});
assert.deepEqual(fileRows.map((row) => [row.fileId, row.linkedTo, row.type]), [["d", "Document", "PDF"], ["p", "Photo", "Image"], ["w", "Warranty", "XLSX"]]);
assert.deepEqual(filterFileRows(fileRows, { q: " invoice", type: null, uploader: null }).map((row) => row.fileId), ["d"]);
assert.deepEqual(filterFileRows(fileRows, { q: "", type: "Image", uploader: null }).map((row) => row.fileId), ["p"]);
assert.deepEqual(filterFileRows(fileRows, { q: "", type: null, uploader: "u" }).map((row) => row.fileId), ["d"]);
const change = (id: string, fromStatus: string | null, toStatus: string | null) => ({ id, at: id, action: null, fromStatus,
  toStatus, fromCondition: null, toCondition: null, reason: null, notes: null, actorName: null });
// Newest first: condition-only edit (5), move inside step 2 (4), into Assigned (3), back to Available (2), registered (1).
const changes = [change("5", "In Maintenance", "In Maintenance"), change("4", "Assigned", "In Maintenance"),
  change("3", "Available", "Assigned"), change("2", "In Maintenance", "Available"), change("1", null, "Available")];
assert.equal(lifecycleStepEntry(changes, ["Assigned", "In Maintenance"])?.id, "3");
assert.equal(lifecycleStepEntry(changes, ["In Maintenance"])?.id, "4");
assert.equal(lifecycleStepEntry(changes, ["Available"])?.id, "2");
assert.equal(lifecycleStepEntry(changes, ["Retired"]), null);
assert.deepEqual(lifecycleSteps("Retired", [true, false, true, false]), ["Completed", "Not Started", "Current", "Not Started"]);
assert.deepEqual(lifecycleSteps("Retired", null), ["Completed", "Completed", "Current", "Not Started"]);
assert.equal(warrantyRemaining("2028-02-20", "2026-11-12"), "1 year 3 months remaining");
assert.equal(warrantyRemaining("2027-11-12", "2026-11-12"), "1 year remaining");
assert.equal(warrantyRemaining("2026-11-30", "2026-11-12"), "Less than a month remaining");
assert.equal(warrantyRemaining("2026-11-11", "2026-11-12"), null);
console.log("asset-profile display checks passed");
