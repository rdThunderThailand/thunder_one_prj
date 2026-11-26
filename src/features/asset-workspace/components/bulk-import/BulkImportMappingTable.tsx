"use client";

import { useId, useState } from "react";
import { ArrowRightIcon, CheckCircleIcon, InfoIcon, MinusIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/lovable/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { autoMap, NON_MAPPABLE_HEADERS, normalizeHeader, setMapping } from "../../domain/asset-import-mapping";
import type { ColumnMapping, ImportColumn, ImportFieldKey } from "../../domain/asset-import-types";

export function BulkImportMappingTable({
  headers,
  sampleRow,
  mapping,
  columns,
  onChange,
  disabled,
}: {
  headers: string[];
  sampleRow: string[];
  mapping: ColumnMapping;
  columns: ImportColumn[];
  onChange: (mapping: ColumnMapping) => void;
  disabled: boolean;
}) {
  const [requiredOnly, setRequiredOnly] = useState(false);
  const toggleId = useId();
  const required = new Set(
    columns.filter((column) => column.required).map((column) => column.key),
  );

  return (
    <>
      <label
        htmlFor={toggleId}
        className="flex min-h-8 shrink-0 items-center justify-end gap-2 text-xs"
      >
        <Switch
          id={toggleId}
          checked={requiredOnly}
          onCheckedChange={setRequiredOnly}
        />
        <span>Show only required fields</span>
      </label>
      <div
        role="region"
        aria-label="Column mapping"
        tabIndex={0}
        className="overflow-x-auto overscroll-x-contain rounded-control border border-border focus-visible:outline-2 focus-visible:outline-ring"
      >
        <table className="w-full min-w-md table-fixed text-left text-xs">
          <thead className="bg-muted text-2xs text-muted-foreground">
            <tr>
              <th className="w-1/4 p-2 font-semibold">File Column (Row 1)</th>
              <th className="w-8 p-2">
                <ArrowRightIcon className="size-3" />
                <span className="sr-only">Maps to</span>
              </th>
              <th className="w-2/5 p-2 font-semibold">ThunderOne Field</th>
              <th className="p-2 font-semibold">Sample Data (Row 2)</th>
              <th className="w-8 p-2">
                <span className="sr-only">Mapping status</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {headers.map((header, index) => {
              const field = mapping[index];
              const detected = autoMap([header])[0];
              if (
                requiredOnly &&
                !(field && required.has(field)) &&
                !(!field && detected && required.has(detected))
              ) {
                return null;
              }
              const metadata = NON_MAPPABLE_HEADERS.includes(
                normalizeHeader(header),
              );
              return (
                <tr key={index}>
                  <th
                    scope="row"
                    className="wrap-anywhere px-2 py-1 font-semibold"
                  >
                    {header || "–"}
                  </th>
                  <td className="px-2 py-1">
                    <ArrowRightIcon className="size-3 text-muted-foreground" />
                  </td>
                  <td className="px-2 py-1">
                    {metadata ? (
                      <span className="text-xs text-muted-foreground">Not imported</span>
                    ) : (
                      <Select
                        value={field ?? "ignore"}
                        disabled={disabled}
                        onValueChange={(value) =>
                          onChange(
                            setMapping(
                              mapping,
                              index,
                              value === "ignore"
                                ? null
                                : (value as ImportFieldKey),
                            ),
                          )
                        }
                      >
                        <SelectTrigger
                          aria-label={`Map column ${index + 1}: ${header}`}
                          title={
                            disabled
                              ? "Change the mapping with Replace File"
                              : undefined
                          }
                          className="h-8 text-xs disabled:bg-muted disabled:opacity-100"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ignore">
                            -- Do not import (ignore) --
                          </SelectItem>
                          {columns.map((column) => (
                            <SelectItem
                              key={column.key}
                              value={column.key}
                              className="text-xs"
                            >
                              <span>{column.label}</span>
                              {column.required && (
                                <span className="text-error"> (Required)</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td
                    className="max-w-40 truncate px-2 py-1 text-muted-foreground"
                    title={sampleRow[index]}
                  >
                    {sampleRow[index] || "–"}
                  </td>
                  <td className="px-2 py-1">
                    {metadata ? (
                      <span
                        role="img"
                        aria-label="Used to link to the original import"
                        title="Used to link to the original import"
                      >
                        <InfoIcon className="size-4 text-info" />
                      </span>
                    ) : field ? (
                      <span role="img" aria-label="Mapped">
                        <CheckCircleIcon className="size-4 text-success" />
                      </span>
                    ) : detected && required.has(detected) ? (
                      <span role="img" aria-label="Required field not mapped">
                        <WarningTriangleIcon className="size-4 text-warning" />
                      </span>
                    ) : (
                      <span role="img" aria-label="Ignored">
                        <MinusIcon className="size-4 text-muted-foreground" />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
