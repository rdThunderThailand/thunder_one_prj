"use client";

import { Button } from "@/components/ui/lovable/button";
import { EditIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { ImportRow } from "../../domain/asset-import-types";
import { ImportSeverityBadge } from "./BulkImportRowMessages";
import { BulkImportRowResultCells } from "./BulkImportRowResultCells";
import { Tag } from "@/components/ui/Tag";
import { ReviewCells, RowIssue } from "./BulkImportRowCells";

export function BulkImportRowsGrid({ rows, variant, onViewRow, onEditRow, }: {
  rows: ImportRow[];
  variant: "validate" | "review" | "result";
  onViewRow: (row: ImportRow) => void;
  onEditRow?: (row: ImportRow) => void;
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
                  : variant === "validate" ? "w-28 sm:w-36" : "w-36",
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
                  className="w-20 p-2 font-semibold"
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
            {!result && <th scope="col" className="w-20 p-2 font-semibold">Action</th>}
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
                title={variant === "validate" ? row.values.name || undefined : undefined}
                className={cn(
                  "p-2 font-semibold",
                  variant === "validate" ? "truncate" : "wrap-anywhere",
                  variant === "review" &&
                    "sticky left-10 z-10 bg-card sm:left-14",
                )}
              >
                {result ? row.values.name || "–" : (
                  <Button variant="ghost" className="min-h-11 w-full min-w-0 justify-start px-0 text-left text-xs text-foreground hover:text-accent-foreground hover:underline"
                    aria-label={`View row ${row.rowIndex}: ${row.values.name || "Unnamed asset"}`} onClick={() => onViewRow(row)}>
                    <span className="truncate">{row.values.name || "–"}</span>
                  </Button>
                )}
                {row.editedAt && <Tag className="ml-1">Edited</Tag>}
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
                  <BulkImportRowResultCells row={row} onViewRow={onViewRow} />
                </>
              )}
              {!result && (
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    {onEditRow && (
                      <Button size="sm" variant={row.severity === "valid" ? "ghost" : "outline"}
                        className="relative h-8 gap-1.5 px-2.5 after:absolute after:-inset-1.5 after:content-['']"
                        onClick={() => onEditRow(row)}>
                        <EditIcon aria-hidden="true" className="size-3.5" />
                        <span>{row.severity === "valid" ? "Edit" : "Fix"}</span>
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
