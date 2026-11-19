import type { ReactNode } from "react";
import Link from "next/link";
import { FileTextIcon, WarningTriangleIcon, XCircleIcon } from "@/components/ui/icons";
import { formatBangkokDateTime, formatCount } from "../../domain/asset-import-format";
import { rowFieldChecks, rowHasExtraMessages, rowIssueCounts } from "../../domain/asset-import-row-details";
import type { ImportBatch, ImportRow } from "../../domain/asset-import-types";
import { BulkImportRowDetailsTables } from "./BulkImportRowDetailsTables";
import { ImportMessageList, ImportResultBadge } from "./BulkImportRowMessages";

const plural = (count: number, word: string) => `${formatCount(count)} ${word}${count === 1 ? "" : "s"}`;

function InfoCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-2xs text-muted-foreground">{label}</p>
      <div className="wrap-anywhere text-xs font-semibold">{children}</div>
    </div>
  );
}

function IssueCard({ tone, title, body }: { tone: "error" | "warning"; title: string; body: string }) {
  const Icon = tone === "error" ? XCircleIcon : WarningTriangleIcon;
  return (
    <div className={`flex items-center gap-3 rounded-control border p-3 ${
      tone === "error" ? "border-error/30 bg-error-muted/40" : "border-warning/30 bg-warning-muted/40"
    }`}>
      <Icon className={`size-6 shrink-0 ${tone === "error" ? "text-error" : "text-warning"}`} />
      <div className="min-w-0">
        <p className={`text-xs font-semibold ${tone === "error" ? "text-error" : "text-warning"}`}>{title}</p>
        <p className="text-2xs">{body}</p>
      </div>
    </div>
  );
}

export function BulkImportRowBody({ row, batch }: { row: ImportRow; batch?: ImportBatch }) {
  const { errors, warnings } = rowIssueCounts(row);
  const registered = row.result === "created" || row.result === "created_with_warning";
  return (
    <>
      <div className="grid grid-cols-2 gap-3 rounded-control border border-border bg-muted/40 p-3 @min-2xl/details:grid-cols-4">
        <InfoCell label="File Name">
          <span className="flex items-center gap-2">
            <FileTextIcon className="size-4 shrink-0 text-success" />
            {batch?.sourceFile?.name ?? "not available"}
          </span>
        </InfoCell>
        <InfoCell label="Import ID">{batch?.batchCode ?? "–"}</InfoCell>
        <InfoCell label="Row Number">{row.rowIndex}</InfoCell>
        <InfoCell label="Row Status">
          <ImportResultBadge result={row.result} />
        </InfoCell>
      </div>
      <BulkImportRowDetailsTables rowIndex={row.rowIndex} checks={rowFieldChecks(row)} />
      {rowHasExtraMessages(row) && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Messages</h3>
          {row.errorMessage && !row.messages.some((message) => message.message === row.errorMessage) && (
            <p className="text-xs">{row.errorMessage}</p>
          )}
          {row.messages.some((message) => message.field === "row") && (
            <ImportMessageList row={{ ...row, messages: row.messages.filter((message) => message.field === "row") }} />
          )}
        </section>
      )}
      {(errors > 0 || warnings > 0 || row.override || row.createdAsset || row.originalRowIndex !== null) && (
        <div className="grid gap-3 @min-2xl/details:grid-cols-2">
          {errors > 0 && (
            <IssueCard tone="error" title={`${plural(errors, "Error")} must be fixed`}
              body={batch?.status === "validated" ? "Choose Fix to correct this row before registration." : "Fix the data in your file and import again."} />
          )}
          {warnings > 0 && (
            <IssueCard
              tone="warning"
              title={registered ? `${plural(warnings, "Warning")} approved` : errors ? `${plural(warnings, "Warning")} (optional to fix)` : `${plural(warnings, "Warning")} not approved`}
              body={registered ? "The asset was created with these warnings." : batch?.status === "validated" ? "Fix this row or approve its warnings during Review & Confirm." : errors ? "You can update this value if needed." : "This row was not registered because its warning was not approved."}
            />
          )}
          {(row.override || row.createdAsset || row.originalRowIndex !== null) && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-control border border-border bg-muted/40 p-3 only:col-span-full">
              {row.createdAsset && (
                <InfoCell label="Created asset">
                  <Link href={`/asset-workspace/assets/${row.createdAsset.id}`} className="inline-flex min-h-8 items-center text-primary underline underline-offset-4">
                    {row.createdAsset.assetTag} · {row.createdAsset.name}
                  </Link>
                </InfoCell>
              )}
              {row.override && (
                <InfoCell label="Override">
                  <span className="block whitespace-pre-wrap">{row.override.reason ?? "–"}</span>
                  <span className="block text-2xs font-normal text-muted-foreground">
                    {row.override.by?.name ?? "Unknown"} · {formatBangkokDateTime(row.override.at)} (Bangkok)
                  </span>
                </InfoCell>
              )}
              {row.originalRowIndex !== null && (
                <InfoCell label="Original row">{row.originalRowIndex}</InfoCell>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

