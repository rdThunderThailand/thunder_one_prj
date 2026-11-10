import { z } from "zod";
import { AssetActionError, readActionFailure } from "./asset-action-error.ts";
import { assetExportFilename } from "./asset-export.ts";

export const LABEL_LIMIT = 500;
export const LABEL_MM = { width: 50, height: 30 } as const;
/** "both" is the PO default label (AC-031): QR reference + Code128 Asset Tag + Asset Name. */
export const LABEL_FORMATS = ["qr", "barcode", "both"] as const;
export type LabelFormat = typeof LABEL_FORMATS[number];
const LABEL_FORMAT_NAMES: Record<LabelFormat, string> = { both: "QR Code + Barcode", qr: "QR Code", barcode: "Barcode (Code128)" };
export const labelFormatName = (format: LabelFormat) => LABEL_FORMAT_NAMES[format];
export const DEFAULT_LABEL_FORMAT: LabelFormat = "both";
/** Text lines the user can print. Serial is PO-optional (05 §4.12.2); it comes from the list row or profile, not Core. */
export const LABEL_FIELDS = ["assetTag", "name", "serialNumber"] as const;
export type LabelField = typeof LABEL_FIELDS[number];
export type LabelFields = Record<LabelField, boolean>;
export const DEFAULT_LABEL_FIELDS: LabelFields = { assetTag: true, name: true, serialNumber: false };
export const LABEL_FIELD_NAMES: Record<LabelField, string> = { assetTag: "Asset Tag", name: "Asset Name", serialNumber: "Serial Number" };
export type LabelCandidate = { id: string; name: string; assetTag: string; status: string; serialNumber?: string | null };
export const assetLabelSchema = z.object({ id: z.guid(), name: z.string(), assetTag: z.string().min(1), qrValue: z.string().max(2048),
  serialNumber: z.string().nullable().optional() });
export type AssetLabel = z.infer<typeof assetLabelSchema>;
export const labelsResponseSchema = z.object({ labels: z.array(assetLabelSchema).min(1).max(LABEL_LIMIT) });

export function labelScope(candidates: readonly LabelCandidate[]): LabelCandidate[] {
  const scope = [...new Map(candidates.map((asset) => [z.guid().parse(asset.id).toLowerCase(), { ...asset, id: asset.id.toLowerCase() }])).values()];
  if (!scope.length) throw new AssetActionError("Select assets first to generate labels.", 400, "VALIDATION");
  if (scope.length > LABEL_LIMIT) throw new AssetActionError("Select at most 500 assets to generate labels.", 400, "VALIDATION");
  const ineligible = scope.filter((asset) => asset.status === "Disposed" || !asset.assetTag.trim());
  if (ineligible.length) throw new AssetActionError(
    "Disposed assets and assets without an Asset Tag cannot get labels. Remove these assets and try again.",
    409, "INVALID_STATE", ineligible.map((asset) => asset.name || asset.assetTag || "Unnamed asset"),
  );
  return scope;
}

export function assertLabelTags(labels: readonly AssetLabel[]) {
  const invalid = labels.filter((label) => !/^[\x20-\x7e]+$/.test(label.assetTag));
  if (invalid.length) throw new AssetActionError(
    "These Asset Tags contain characters Code128 cannot print. No labels were generated.",
    400, "INVALID_TAG", invalid.map((label) => label.name || label.assetTag),
  );
}

/** Barcode restrictions must not prevent printing a QR-only label. */
export function assertLabelFormat(labels: readonly AssetLabel[], format: LabelFormat) {
  if (!LABEL_FORMATS.includes(format)) throw new AssetActionError("Choose a label type.", 400, "VALIDATION");
  if (format !== "qr") assertLabelTags(labels);
}

export function labelFailure(error: unknown, candidates: readonly LabelCandidate[]): AssetActionError {
  if (error instanceof AssetActionError) return error;
  const { status, code, details, serverMessage } = readActionFailure(error);
  let message = "Labels could not be prepared. Try again.";
  let names: string[] = [];
  if (status === 400) message = code === "VALIDATION" && serverMessage?.includes("500") && serverMessage.length < 300
    ? serverMessage : "The label selection was not accepted. Select at most 500 assets and try again.";
  else if (status === 401) message = "Your session has expired. Sign in again to prepare labels.";
  else if (status === 403) message = "You do not have permission to prepare asset labels. Check your account and organization.";
  else if (status === 404) message = "Refresh the list and check your selection. No labels were generated.";
  else if (status === 409) {
    message = "Some selected assets are no longer eligible for labels. Disposed assets and assets without an Asset Tag block the whole batch.";
    const parsed = z.object({ assetIds: z.array(z.guid()) }).safeParse(details);
    const ids = new Set(parsed.success ? parsed.data.assetIds.map((id) => id.toLowerCase()) : []);
    names = candidates.filter((asset) => ids.has(asset.id.toLowerCase())).map((asset) => asset.name || asset.assetTag || "Unnamed asset");
  }
  return new AssetActionError(message, status, code, names);
}

export const assetLabelsFilename = (date = new Date()) => assetExportFilename(date).replace("assets-export-", "asset-labels-").replace(".csv", ".pdf");
