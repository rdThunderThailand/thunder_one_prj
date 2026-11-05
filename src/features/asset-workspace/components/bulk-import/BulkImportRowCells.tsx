"use client";

import { AlertCircleIcon, WarningTriangleIcon } from "@/components/ui/icons";
import type { AssetCondition } from "../../domain/asset-condition";
import type { ImportRow } from "../../domain/asset-import-types";
import { importResultMessage, rowMessageText } from "../../domain/asset-import-messages";
import { ConditionBadge } from "../StatusBadges";
import { BulkImportRowMessages, ImportSeverityBadge } from "./BulkImportRowMessages";

export function RowIssue({ row, result = false }: { row: ImportRow; result?: boolean }) {
  if (result) {
    const message = importResultMessage(row);
    return (
      <div className="flex items-start gap-1">
        {message.severity === "error" ? (
          <AlertCircleIcon className="mt-0.5 size-3 shrink-0 text-error" />
        ) : message.severity === "warning" ? (
          <WarningTriangleIcon className="mt-0.5 size-3 shrink-0 text-warning" />
        ) : null}
        <span className={message.severity === "error" ? "text-error" : undefined}>{message.text}</span>
      </div>
    );
  }
  const message = row.messages[0];
  if (!message) {
    return (
      <span className="text-muted-foreground">
        –
      </span>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-x-2">
      <p className="flex min-w-0 items-start gap-1">
        {message.severity === "warning" ? (
          <WarningTriangleIcon className="mt-0.5 size-3 shrink-0 text-warning" />
        ) : (
          <AlertCircleIcon className="mt-0.5 size-3 shrink-0 text-error" />
        )}
        <span>{rowMessageText(message, row.values)}</span>
      </p>
      <BulkImportRowMessages row={row} />
    </div>
  );
}

export function ReviewCells({ row }: { row: ImportRow }) {
  const condition = row.values.condition || "Good";
  const knownCondition = ["Good", "Fair", "Damaged", "Unusable"].includes(
    condition,
  );
  return (
    <>
      <td className="wrap-anywhere p-2">
        {row.values.asset_tag || (
          <span className="text-muted-foreground">Auto</span>
        )}
      </td>
      <td className="wrap-anywhere p-2">{row.values.category || "–"}</td>
      <td className="wrap-anywhere p-2">{row.values.location || "–"}</td>
      <td className="wrap-anywhere p-2">
        {row.values.assignee ? (
          <span>{row.values.assignee}</span>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
        {row.severity !== "error" && (
          <span className="block text-2xs text-muted-foreground">
            {row.values.assignee ? "Assigned" : "Available"}
          </span>
        )}
      </td>
      <td className="wrap-anywhere p-2">{row.values.purchase_date || "–"}</td>
      <td className="wrap-anywhere p-2">
        {knownCondition ? (
          <ConditionBadge condition={condition as AssetCondition} />
        ) : (
          <span>{condition}</span>
        )}
      </td>
      <td className="p-2">
        {row.messages.length ? (
          <BulkImportRowMessages row={row}>
            <ImportSeverityBadge severity={row.severity} />
          </BulkImportRowMessages>
        ) : (
          <ImportSeverityBadge severity={row.severity} />
        )}
      </td>
    </>
  );
}
