import { formatCount } from "./asset-import-format.ts";

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
