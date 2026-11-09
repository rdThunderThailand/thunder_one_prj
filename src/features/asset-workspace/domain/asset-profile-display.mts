import { WARRANTY_TONE } from "./status-tone.ts";

/** Core supplies root first; a deeper hierarchy stays visible in the subcategory. */
export function categoryDisplay(path: { name: string | null }[]) {
  const names = path.map((item) => item.name?.trim() || "Unnamed category");
  return { category: names[0] || "Uncategorized", subcategory: names.slice(1).join(" > ") };
}

export function profileWarranty(expiryStatus: "Active" | "Expiring Soon" | "Expired" | null) {
  const label = expiryStatus ?? "No Warranty";
  return { label: expiryStatus ?? "No warranty", tone: WARRANTY_TONE[label] };
}

const GROUP_LABELS: Record<string, string> = {
  registered: "Asset registered",
  details_edited: "Details edited",
  photos_updated: "Photos updated",
  documents_updated: "Documents updated",
};

export function historyGroupLabel(kind: string, summary: string | null) {
  return GROUP_LABELS[kind] ?? (summary?.trim() || "Asset updated");
}

export function attachmentLabel(action: string, kind: string | null) {
  const name = kind === "photo" ? "Photo" : kind === "document" ? "Document" : "File";
  return `${name} ${action === "asset.attachment.remove" ? "removed" : "added"}`;
}
