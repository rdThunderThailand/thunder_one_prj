"use client";

import Link from "next/link";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/lovable/sheet";
import { Button } from "@/components/ui/lovable/button";
import { formatBangkokDateTime } from "../../domain/asset-import-format";
import {
  IMPORT_FIELD_KEYS,
  type ImportFieldKey,
  type ImportRow,
} from "../../domain/asset-import-types";
import { ImportMessageList, ImportResultBadge } from "./BulkImportRowMessages";

const LABELS: Record<ImportFieldKey, string> = {
  name: "Asset Name",
  category: "Category",
  location: "Location",
  asset_tag: "Asset Tag",
  serial_number: "Serial Number",
  purchase_date: "Acquisition Date",
  condition: "Condition",
  assignee: "Assignee",
  notes: "Notes",
};

export function BulkImportRowSheet({
  row,
  open,
  onOpenChange,
}: {
  row: ImportRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-dvh max-h-dvh w-full flex-col gap-4 bg-card p-4 sm:max-w-md sm:p-6 [&>button]:inline-flex [&>button]:size-8 [&>button]:items-center [&>button]:justify-center"
      >
        <SheetHeader className="shrink-0 pr-8 text-left">
          <SheetTitle>Row {row.rowIndex}</SheetTitle>
          <SheetDescription>
            Source values and registration result.
          </SheetDescription>
          <div>
            <ImportResultBadge result={row.result} />
          </div>
        </SheetHeader>
        <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overscroll-contain wrap-anywhere pr-1 text-xs">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">File values</h3>
            <dl className="space-y-2">
              {IMPORT_FIELD_KEYS.map((key) => (
                <div key={key} className="grid grid-cols-[1fr_1.5fr] gap-3">
                  <dt className="text-muted-foreground">{LABELS[key]}</dt>
                  <dd className="min-w-0 whitespace-pre-wrap">
                    {row.values[key] || "–"}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold">Messages</h3>
            {row.errorMessage && !row.messages.some((message) => message.message === row.errorMessage) && (
              <p>{row.errorMessage}</p>
            )}
            <ImportMessageList row={row} />
          </section>
          {row.override && (
            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="text-sm font-semibold">Override</h3>
              <p className="whitespace-pre-wrap">{row.override.reason ?? "–"}</p>
              <p className="text-muted-foreground">
                {row.override.by?.name ?? "Unknown"} ·{" "}
                {formatBangkokDateTime(row.override.at)} (Bangkok)
              </p>
            </section>
          )}
          {row.createdAsset && (
            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="text-sm font-semibold">Created asset</h3>
              <Link
                href={`/asset-workspace/assets/${row.createdAsset.id}`}
                className="inline-flex min-h-8 items-center text-primary underline underline-offset-4"
              >
                {row.createdAsset.assetTag} · {row.createdAsset.name}
              </Link>
            </section>
          )}
          {row.originalRowIndex !== null && (
            <p className="text-muted-foreground">
              Original row {row.originalRowIndex}
            </p>
          )}
        </div>
        <SheetFooter className="shrink-0 border-t border-border pt-3">
          <SheetClose asChild>
            <Button size="sm" variant="outline">
              Close
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
