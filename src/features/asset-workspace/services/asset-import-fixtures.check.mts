import type { ImportOptions } from "../domain/asset-import-types.ts";

// Small contract fixtures belong only to this check file; app code never imports them.
export const OPTIONS: ImportOptions = {
  ready: true, reason: null,
  file: { extensions: [".xlsx", ".csv"], mimeTypes: ["text/csv"], maxBytes: 10485760, maxRows: 5000, sourceFilePurpose: "import_source" },
  chunks: { rowsPerRequest: 1000, confirmRowsPerRequest: 100 },
  columns: [
    ["name", "Asset Name", true], ["category", "Category", true], ["location", "Location", true],
    ["asset_tag", "Asset Tag", false], ["serial_number", "Serial Number", false], ["purchase_date", "Purchase Date", false],
    ["condition", "Condition", false], ["assignee", "Assignee", false], ["notes", "Notes", false],
  ].map(([key, label, required]) => ({ key, label, required, example: "Example" })) as ImportOptions["columns"],
  referenceMatching: { category: ["code", "name"], location: ["code", "path", "name"], locationPathSeparator: " > ", assignee: ["email"], ambiguous: "error" },
  conditions: ["Good", "Fair", "Damaged"], conditionsByStatus: { Available: ["Good", "Fair"], Assigned: ["Good", "Fair", "Damaged"] },
  defaultCondition: "Good", dateFormat: "YYYY-MM-DD",
  tagGeneration: { modes: ["automatic", "manual"], prefix: "AST", sequenceDigits: 6, format: "AST-######", allocatedOn: "create", reservesTag: false },
  serialOverride: { field: "override_reason", maxLength: 1000, reasonIsConfirmation: true },
  referenceSelectors: { categories: "/categories", locations: "/locations", orgUnits: "/org-units", persons: "/persons" },
  registeredAssetsPath: "/assets/list?import_batch_id={batchId}",
};
export const CATEGORIES = [
  { code: "OFFICE", name: "อุปกรณ์สำนักงาน", serialRequired: false, active: true },
  { code: "OLD-FURN", name: "Inactive", serialRequired: false, active: false },
];
export const LOCATIONS = [{ code: "HQ", path: "HQ > ชั้น 1" }];

export const tenantId = "11111111-1111-4111-8111-111111111111";
export const userId = "22222222-2222-4222-8222-222222222222";
export const context = { tenantId, userId };
