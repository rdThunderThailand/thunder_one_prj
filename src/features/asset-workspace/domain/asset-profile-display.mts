import type { AssetFiles, AssetStatusChange } from "../services/asset-profile-contract.ts";
import { HISTORY_EVENT_TONE, WARRANTY_TONE } from "./status-tone.ts";

/** Core supplies root first; a deeper hierarchy stays visible in the subcategory. */
export function categoryDisplay(path: { name: string | null }[]) {
  const names = path.map((item) => item.name?.trim() || "Unnamed category");
  return { category: names[0] || "Uncategorized", subcategory: names.slice(1).join(" > ") };
}

export function profileWarranty(expiryStatus: "Active" | "Expiring Soon" | "Expired" | null) {
  const label = expiryStatus ?? "No Warranty";
  return { label: expiryStatus ?? "No warranty", tone: WARRANTY_TONE[label] };
}

/** FE 03 event types; tones come from status-tone.ts. Unknown types show as Other. */
export const HISTORY_EVENT_TYPES = [
  { id: "registered", label: "Registered" },
  { id: "details", label: "Details" },
  { id: "assign", label: "Assignment" },
  { id: "transfer", label: "Transfer" },
  { id: "return", label: "Return" },
  { id: "location", label: "Location" },
  { id: "status", label: "Status" },
  { id: "files", label: "File" },
  { id: "warranty", label: "Warranty" },
] as const;
export function historyEventType(id: string) {
  const type = HISTORY_EVENT_TYPES.find((entry) => entry.id === id) ?? { id: "other", label: "Other" };
  return { ...type, tone: HISTORY_EVENT_TONE[type.id] ?? "zinc" };
}

export const HISTORY_DATE_RANGES = [
  { id: "today", label: "Today" }, { id: "7d", label: "Last 7 days" }, { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" }, { id: "year", label: "This year" },
] as const;
export type HistoryDateRange = (typeof HISTORY_DATE_RANGES)[number]["id"];

/** Inclusive Bangkok days for Core's date_from / date_to; `today` is a Bangkok `YYYY-MM-DD`. */
export function historyDateRange(range: HistoryDateRange, today: string): { from: string; to: string } {
  if (range === "year") return { from: `${today.slice(0, 4)}-01-01`, to: today };
  const back = { today: 0, "7d": 6, "30d": 29, "90d": 89 }[range];
  const day = new Date(`${today}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - back);
  return { from: day.toISOString().slice(0, 10), to: today };
}

/** FE 02 stepper: PO statuses only; a legacy status leaves every step "Not Started" (decisions.md, C10). */
export const LIFECYCLE_STEPS = [
  { label: "Available", statuses: ["Available"] },
  { label: "Assigned / In Maintenance", statuses: ["Assigned", "In Maintenance"] },
  { label: "Retired", statuses: ["Retired"] },
  { label: "Disposed", statuses: ["Disposed"] },
] as const;
export type LifecycleStepState = "Completed" | "Current" | "Not Started";

/** `entered[i]` false: the full history shows step i was skipped (e.g. Available → Retired), so it stays Not Started. */
export function lifecycleSteps(status: string, entered?: readonly boolean[] | null): LifecycleStepState[] {
  const current = LIFECYCLE_STEPS.findIndex((step) => (step.statuses as readonly string[]).includes(status));
  return LIFECYCLE_STEPS.map((_, index) => current < 0 || index > current || entered?.[index] === false ? "Not Started"
    : index === current ? "Current" : "Completed");
}

/** FE 01: one read-only list of photos, documents and warranty documents, newest first. */
export type ProfileFileRow = AssetFiles["documents"][number] & { linkedTo: "Photo" | "Document" | "Warranty"; type: string };

export function fileTypeLabel(mimeType: string, filename: string) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "Image";
  const extension = /\.([a-z0-9]{1,5})$/i.exec(filename)?.[1];
  return extension ? extension.toUpperCase() : "File";
}

export function profileFileRows(files: AssetFiles): ProfileFileRow[] {
  const tag = (linkedTo: ProfileFileRow["linkedTo"]) => (file: AssetFiles["documents"][number]) =>
    ({ ...file, linkedTo, type: fileTypeLabel(file.mimeType, file.filename) });
  return [...files.photos.map(tag("Photo")), ...files.documents.map(tag("Document")), ...files.warrantyDocuments.map(tag("Warranty"))]
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function filterFileRows(rows: ProfileFileRow[], filter: { q: string; type: string | null; uploader: string | null }) {
  const q = filter.q.trim().toLowerCase();
  return rows.filter((row) => (!q || row.filename.toLowerCase().includes(q))
    && (!filter.type || row.type === filter.type)
    && (!filter.uploader || row.uploadedBy?.id === filter.uploader));
}

/** Newest change that moved the asset into `statuses` from outside them (rows newest first, BE 01).
 *  Condition-only rows (from = to) and moves inside the group (Assigned → In Maintenance) don't count. */
export function lifecycleStepEntry(rows: readonly AssetStatusChange[], statuses: readonly string[]) {
  return rows.find((row) => row.toStatus !== null && statuses.includes(row.toStatus)
    && (row.fromStatus === null || !statuses.includes(row.fromStatus))) ?? null;
}

/** Whole months left until a YYYY-MM-DD end date; null once it has passed. */
export function warrantyRemaining(endDate: string | null, today: string) {
  if (!endDate || endDate.slice(0, 10) < today) return null;
  const [y1, m1, d1] = today.split("-").map(Number);
  const [y2, m2, d2] = endDate.slice(0, 10).split("-").map(Number);
  const months = (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
  if (months < 1) return "Less than a month remaining";
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const part = (count: number, unit: string) => count ? `${count} ${unit}${count === 1 ? "" : "s"}` : "";
  return `${[part(years, "year"), part(rest, "month")].filter(Boolean).join(" ")} remaining`;
}
