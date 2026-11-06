"use client";

import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { cn } from "@/lib/utils";
import type { ImportRow } from "../../domain/asset-import-types";
import { ImportSeverityBadge } from "./BulkImportRowMessages";
import { ReviewCells, RowIssue } from "./BulkImportRowCells";

export function BulkImportRowsGrid({ rows, variant, onViewRow }: {
  rows: ImportRow[];
  variant: "validate" | "review" | "result";
  onViewRow: (row: ImportRow) => void;
}) {
  const result = variant === "result";
  return (
    <div
      role="region"
      aria-label="Import rows"
      tabIndex={0}
      className={cn(
        "max-w-full overflow-x-auto overscroll-x-contain rounded-control border border-border focus-visible:outline-2 focus-visible:outline-ring",
        variant === "review" && "flex-1",
      )}
    >
      <table
        className={cn(
          "w-full table-fixed text-left text-xs",
          variant === "validate" ? "min-w-[26rem]" : "min-w-4xl",
        )}
      >
        <thead className="bg-muted text-2xs text-muted-foreground">
          <tr>
            <th
              scope="col"
              className={cn(
                "w-10 p-2 font-semibold sm:w-14",
                variant === "review" &&
                  "sticky left-0 z-10 bg-muted",
              )}
            >
              {variant === "review" ? "#" : "Row"}
            </th>
            <th
              scope="col"
              className={cn(
                "p-2 font-semibold",
                variant === "review"
                  ? "sticky left-10 z-10 w-36 bg-muted sm:left-14 sm:w-44"
                  : variant === "validate" ? "w-1/3" : "w-36",
              )}
            >
              Asset Name
            </th>
            {variant === "validate" ? (
              <>
                <th scope="col" className="p-2 font-semibold">
                  Issue
                </th>
                <th
                  scope="col"
                  className="w-24 p-2 font-semibold"
                >
                  Status
                </th>
              </>
            ) : variant === "review" ? (
              [
                "Asset Tag",
                "Category",
                "Location",
                "Assignee",
                "Acquisition Date",
                "Condition",
                "Row Status",
              ].map((title) => (
                <th
                  scope="col"
                  key={title}
                  className="p-2 font-semibold"
                >
                  {title}
                </th>
              ))
            ) : (
              [
                "Asset Tag / Serial",
                "Category",
                "Location",
                "Message",
                "Action",
              ].map((title) => (
                <th
                  scope="col"
                  key={title}
                  className={cn(
                    "p-2 font-semibold",
                    title === "Message" && "w-1/4",
                    title === "Action" && "w-28",
                  )}
                >
                  {title}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                result &&
                  row.result === "not_registered" &&
                  "bg-error-muted/30",
              )}
            >
              <td
                className={cn(
                  "p-2 tabular-nums",
                  variant === "review" &&
                    "sticky left-0 z-10 bg-card",
                  result &&
                    row.result === "not_registered" &&
                    "font-semibold text-error",
                )}
              >
                {row.rowIndex}
              </td>
              <td
                className={cn(
                  "wrap-anywhere p-2 font-semibold",
                  variant === "review" &&
                    "sticky left-10 z-10 bg-card sm:left-14",
                )}
              >
                {row.values.name || "–"}
              </td>
              {variant === "validate" ? (
                <>
                  <td className="wrap-anywhere p-2">
                    <RowIssue row={row} />
                  </td>
                  <td className="p-2">
                    <ImportSeverityBadge
                      severity={row.severity}
                    />
                  </td>
                </>
              ) : variant === "review" ? (
                <ReviewCells row={row} />
              ) : (
                <>
                  <td className="wrap-anywhere p-2">
                    {row.createdAsset ? (
                      <Link
                        href={`/asset-workspace/assets/${row.createdAsset.id}`}
                        className="inline-flex min-h-8 items-center text-primary underline-offset-4 hover:underline"
                      >
                        {row.createdAsset.assetTag}
                      </Link>
                    ) : (
                      <span>{row.values.asset_tag || "–"}</span>
                    )}
                    <span className="block text-2xs text-muted-foreground">
                      {row.values.serial_number || "–"}
                    </span>
                  </td>
                  <td className="wrap-anywhere p-2">
                    {row.values.category || "–"}
                  </td>
                  <td className="wrap-anywhere p-2">
                    {row.values.location || "–"}
                  </td>
                  <td className="wrap-anywhere p-2">
                    <RowIssue row={row} result />
                  </td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewRow(row)}
                    >
                      View Row
                    </Button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
