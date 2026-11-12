"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/lovable/button";
import type { ImportFieldKey, ImportOptions } from "../../domain/asset-import-types";

const DESCRIPTIONS: Record<ImportFieldKey, string> = {
  name: "Name of the asset",
  category: "Category code or name",
  location: "Code, full path or unique name",
  asset_tag: "Leave blank to generate",
  serial_number: "Required by some categories",
  purchase_date: "YYYY-MM-DD",
  condition: "Good, Fair or Damaged",
  assignee: "Email, org unit or person",
  notes: "Optional",
};


export function BulkImportTemplatePreview({
  options,
}: {
  options: ImportOptions;
}) {
  return (
    <Card className="min-w-0 space-y-3 focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Template Preview</h2>
        <Button variant="link" size="sm" disabled>
          View all columns
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        The template includes required fields and examples.
      </p>
      <div
        role="region"
        aria-label="Template columns"
        tabIndex={0}
        className="overflow-x-auto rounded-control border border-border focus-visible:outline-2 focus-visible:outline-ring"
      >
        <table className="w-full min-w-md table-fixed text-left text-xs leading-relaxed sm:min-w-0">
          <thead className="bg-muted text-foreground">
            <tr>
              <th className="w-1/4 p-2 font-semibold">Column Name</th>
              <th className="w-20 p-2 text-center font-semibold">Required</th>
              <th className="p-2 font-semibold">Description</th>
              <th className="w-1/4 p-2 font-semibold">Example</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {options.columns.map((column) => (
              <tr key={column.key}>
                <th scope="row" className="wrap-anywhere p-2 align-top font-medium text-foreground">
                  {column.label}
                </th>
                <td className="p-2 text-center align-top">
                  <span
                    className={
                      column.required
                        ? "text-error"
                        : "text-muted-foreground"
                    }
                    aria-label={column.required ? "Required" : "Optional"}
                  >
                    {column.required ? "*" : "–"}
                  </span>
                </td>
                <td className="wrap-anywhere p-2 align-top text-muted-foreground">
                  {DESCRIPTIONS[column.key]}
                </td>
                <td className="wrap-anywhere p-2 align-top text-muted-foreground">
                  {column.example}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
