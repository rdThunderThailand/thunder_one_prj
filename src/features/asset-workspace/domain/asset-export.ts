import { z } from "zod";
import type { AssetListQuery } from "../services/assets-list-query.ts";

export const EXPORT_MAX_ASSETS = 10_000;
const assetIdSchema = z.guid();
export const EXPORT_FILTER_KEYS = [
  "q", "status", "condition", "category_id", "location_id", "import_batch_id", "custody_type", "custody_id",
] as const;

export const EXPORT_COLUMNS = [
  "System Asset ID", "Asset Tag", "Asset Name", "Serial Number", "Category", "Location",
  "Status", "Condition", "Assignee", "Acquisition Date", "Last Updated",
] as const;

type ExportFilters = Pick<AssetListQuery, (typeof EXPORT_FILTER_KEYS)[number]>;
export type AssetExportRequest =
  | { scope: "selected"; asset_ids: string[] }
  | { scope: "filtered"; filters: ExportFilters };

export type AssetExportScope = {
  request: AssetExportRequest;
  count: number;
  label: string;
};

export function selectedAssetExport(ids: readonly string[]): AssetExportScope {
  const unique = [...new Set(ids.map((id) => assetIdSchema.parse(id).toLowerCase()))];
  if (!unique.length) throw new Error("Select at least one asset to export.");
  const issue = exportCountIssue(unique.length);
  if (issue) throw new Error(issue);
  return {
    request: { scope: "selected", asset_ids: unique },
    count: unique.length,
    label: "Selected assets on this page",
  };
}

/** The list query also holds pagination and sorting; neither belongs in an export request. */
export function filteredAssetExport(query: AssetListQuery, count: number): AssetExportScope {
  const filters: Record<string, string> = {};
  for (const key of EXPORT_FILTER_KEYS) {
    const value = query[key]?.trim();
    if (value) filters[key] = value;
  }
  if (filters.custody_id && !filters.custody_type) {
    throw new Error("Choose an assignee type before exporting this scope.");
  }
  return {
    request: { scope: "filtered", filters: filters as ExportFilters },
    count,
    label: Object.keys(filters).length ? "Current filtered assets across all pages" : "All assets in this organization",
  };
}

export function exportCountIssue(count: number): string | null {
  if (!Number.isInteger(count) || count <= 0) return "No eligible assets were found for this export.";
  if (count > EXPORT_MAX_ASSETS) return "Export covers at most 10,000 assets. Narrow the filters or the selection.";
  return null;
}

export function assetExportFilename(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `assets-export-${value("year")}-${value("month")}-${value("day")}.csv`;
}
