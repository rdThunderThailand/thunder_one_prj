"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircleIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/lovable/badge";
import { Button } from "@/components/ui/lovable/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/lovable/popover";
import {
  IMPORT_RESULT_BADGE,
  IMPORT_SEVERITY_BADGE,
} from "../../domain/status-tone";
import { formatCount } from "../../domain/asset-import-format";
import { rowMessageText } from "../../domain/asset-import-messages";
import type { ImportRow, RowResult, Severity } from "../../domain/asset-import-types";

const SEVERITY_LABEL = {
  valid: "Valid",
  warning: "Warning",
  error: "Error",
};

const RESULT_LABEL = {
  created: "Created",
  created_with_warning: "Created with Warnings",
  not_registered: "Not Registered",
};

export function ImportSeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge variant={IMPORT_SEVERITY_BADGE[severity]}>
      {SEVERITY_LABEL[severity]}
    </Badge>
  );
}

export function ImportResultBadge({ result }: { result: RowResult | null }) {
  return result ? (
    <Badge variant={IMPORT_RESULT_BADGE[result]}>{RESULT_LABEL[result]}</Badge>
  ) : (
    <Badge variant="neutral">Pending</Badge>
  );
}

export function BulkImportRowMessages({
  row,
  children,
}: {
  row: ImportRow;
  children?: ReactNode;
}) {
  if (!row.messages.length) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="link"
          size="sm"
          className="h-auto min-h-8 whitespace-normal px-0 text-start text-2xs"
          aria-label={`Messages for row ${row.rowIndex}`}
        >
          {children ??
            (row.messages.length > 1
              ? `+${row.messages.length - 1} more`
              : "Details")}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-80 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-control bg-card"
      >
        <h3 className="mb-3 text-sm font-semibold">Row {row.rowIndex}</h3>
        <ImportMessageList row={row} />
      </PopoverContent>
    </Popover>
  );
}

export function ImportMessageList({ row }: { row: ImportRow }) {
  if (!row.messages.length) {
    return <p className="text-xs text-muted-foreground">No messages.</p>;
  }
  return (
    <ul className="space-y-3 text-xs">
      {row.messages.map((message, index) => (
        <li key={`${message.code}:${index}`} className="space-y-2 wrap-anywhere">
          <p className="flex items-start gap-2">
            {message.severity === "warning" ? (
              <WarningTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
            ) : (
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-error" />
            )}
            <span>{rowMessageText(message, row.values)}</span>
          </p>
          {Array.isArray(message.details) && message.details.length > 0 && (
            <div className="space-y-1 pl-6">
              <p className="font-semibold">Already used by:</p>
              <ul className="space-y-1">
                {message.details.map((asset) => (
                  <li key={asset.id}>
                    <Link
                      href={`/asset-workspace/assets/${asset.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-8 items-center text-primary underline underline-offset-4"
                    >
                      {asset.assetTag ?? "–"} · {asset.name}
                    </Link>
                  </li>
                ))}
              </ul>
              {message.detailsTotal !== undefined && message.detailsTotal > message.details.length && (
                <p className="text-muted-foreground">
                  and {formatCount(message.detailsTotal - message.details.length)} more
                </p>
              )}
            </div>
          )}
          {message.details &&
            !Array.isArray(message.details) &&
            "rows" in message.details && (
              <p className="pl-6 text-muted-foreground">
                Also in rows {message.details.rows.join(", ")}
                {message.details.total - 1 > message.details.rows.length
                  ? ` and ${formatCount(message.details.total - 1 - message.details.rows.length)} more`
                  : ""}
              </p>
            )}
          {message.details &&
            !Array.isArray(message.details) &&
            "candidates" in message.details && (
              <div className="space-y-1 pl-6">
                <p className="font-semibold">Matches:</p>
                <ul className="space-y-1 font-mono text-2xs">
                  {message.details.candidates.map((candidate) => (
                    <li key={candidate}>{candidate}</li>
                  ))}
                </ul>
              </div>
            )}
        </li>
      ))}
    </ul>
  );
}
