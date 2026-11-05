import { formatCount } from "./asset-import-format.ts";
import type { ImportFieldKey, ImportRow, RowMessage } from "./asset-import-types.ts";

const FIELD_LABELS: Record<ImportFieldKey | "row", string> = {
  name: "Asset Name",
  category: "Category",
  location: "Location",
  asset_tag: "Asset Tag",
  serial_number: "Serial Number",
  purchase_date: "Acquisition Date",
  condition: "Condition",
  assignee: "Assignee",
  notes: "Notes",
  row: "Row",
};

const SAFE_CORE_VALIDATION = new Set([
  "Asset Name is required.",
  "Asset Name must be at most 250 characters.",
  "Asset Tag must be at most 100 characters.",
  "Serial Number must be at most 250 characters.",
  "Notes must be at most 5,000 characters.",
  "This row could not be registered; check its values and import it again",
]);

export function rowMessageText(
  message: RowMessage,
  values: Partial<Record<ImportFieldKey, string>> = {},
): string {
  const fieldLabel = FIELD_LABELS[message.field] ?? "Field";
  const value = message.field === "row" ? "" : (values[message.field]?.trim() ?? "");

  switch (message.code) {
    case "REQUIRED":
      return `${fieldLabel} is required.`;
    case "VALIDATION":
      return SAFE_CORE_VALIDATION.has(message.message)
        ? message.message
        : `${fieldLabel} is not valid.`;
    case "INVALID_DATE":
      return "Acquisition date must be YYYY-MM-DD.";
    case "INVALID_CONDITION":
      return "Condition must be Good, Fair or Damaged (Damaged needs an Assignee).";
    case "UNKNOWN_CATEGORY":
      return `Category "${value}" was not found or is inactive.`;
    case "UNKNOWN_LOCATION":
      return `Location "${value}" was not found or is inactive.`;
    case "UNKNOWN_ASSIGNEE":
      return `Assignee "${value}" was not found.`;
    case "AMBIGUOUS_REFERENCE":
      return `"${value}" matches more than one ${fieldLabel.toLowerCase()}. Use the code or full path.`;
    case "SERIAL_REQUIRED":
      return "This category requires a Serial Number.";
    case "SERIAL_DUPLICATE":
      return "Serial Number is already used.";
    case "TAG_TAKEN":
      return "Asset Tag is already used.";
    case "TAG_DUPLICATE_IN_FILE":
      return "Asset Tag appears more than once in this file.";
    case "ALREADY_IMPORTED":
      return "This row was already registered by an earlier import.";
    case "UNKNOWN_SOURCE_ROW":
      return "Source Row is missing or not in the original import.";
    case "SOURCE_ROW_DUPLICATE_IN_FILE":
      return "This source row appears on more than one row of this file.";
  }
}

/** Result is authoritative: validation severity and error codes survive an approved warning. */
export function importResultMessage(row: ImportRow): { text: string; severity: "warning" | "error" | null } {
  if (row.result === "created") return { text: "Created", severity: null };
  if (row.result === null) return { text: "Pending", severity: null };
  const severity = row.result === "not_registered" ? "error" : "warning";
  if (row.errorMessage) return { text: row.errorMessage, severity };
  const latestError = row.messages.findLast((message) => message.severity === "error");
  const message = latestError ?? row.messages[0];
  return { text: message ? rowMessageText(message, row.values)
    : row.result === "not_registered" ? "Not Registered" : "Created with Warnings", severity };
}

export function requestErrorText(code: string, status = 0): string {
  if (status === 401 || code === "UNAUTHENTICATED") {
    return "Sign in again to continue.";
  }
  if (status === 403 || code === "PERMISSION_DENIED") {
    return "You do not have permission to import assets.";
  }
  if (code === "IMPORT_UNAVAILABLE" || code === "REGISTRATION_UPLOAD_UNAVAILABLE") {
    return "Bulk import is not available yet.";
  }
  if (code === "UPLOAD_RETRY") {
    return "The upload could not start. Try again.";
  }
  if (code === "CONFIRM_UNAVAILABLE") {
    return "Asset confirmation is not available yet. Try again when the service is enabled.";
  }
  if (code === "UPLOAD_EXPIRED") {
    return "The upload expired. Try again.";
  }
  if (code === "UPLOAD_CONFLICT") {
    return "This upload cannot be reused. Remove the file and select it again.";
  }
  if (code === "UPLOAD_CONTENT_INVALID") {
    return "The file content does not match its type. Save it again as XLSX or CSV UTF-8.";
  }
  if (code === "ORIGINAL_IMPORT_NOT_FOUND") {
    return "The original import was not found. Check that this is its Error file.";
  }
  if (code === "ORIGINAL_IMPORT_UNFINISHED") {
    return "The original import has not finished.";
  }
  if (code === "CONNECTION_FAILED") {
    return "Could not reach the asset service. Try again.";
  }
  if (status === 503) return "Bulk import is not available yet.";
  if (code === "INVALID_STATE" || status === 409) {
    return "This import has moved on. Reloading its latest state.";
  }
  if (code === "NOT_FOUND" || status === 404) {
    return "This import is no longer available.";
  }
  if (code === "VALIDATION" || status === 400) {
    return "Some information was not accepted. Check the highlighted items.";
  }
  return "Something went wrong. Try again.";
}

export function parseErrorText(
  code:
    | "TYPE"
    | "SIZE"
    | "ENCODING"
    | "EMPTY"
    | "TOO_MANY_ROWS"
    | "MIXED_IMPORT"
    | "UNREADABLE",
  rowCount = 0,
): string {
  switch (code) {
    case "TYPE":
      return "Only XLSX or CSV files are supported.";
    case "SIZE":
      return "The file is larger than 10 MB.";
    case "ENCODING":
      return "Save the CSV as 'CSV UTF-8' or use XLSX.";
    case "EMPTY":
      return "The file has no data rows.";
    case "TOO_MANY_ROWS":
      return `The file has ${formatCount(rowCount)} rows; the limit is 5,000.`;
    case "MIXED_IMPORT":
      return "This file mixes rows from several imports.";
    case "UNREADABLE":
      return "The file could not be read.";
  }
}
