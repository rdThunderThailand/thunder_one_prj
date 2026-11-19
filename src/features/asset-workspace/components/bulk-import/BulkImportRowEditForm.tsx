"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlertCircleIcon } from "@/components/ui/icons";
import type { ColumnMapping, ImportOptions, ImportRow } from "../../domain/asset-import-types";
import type { useAssetImportEdit } from "../../hooks/use-asset-import-edit";
import type { RegistrationOptions } from "../../services/asset-registration-contract";
import { refreshRegistrationOptions } from "../../services/asset-registration-client";
import { BulkImportRowEditField } from "./BulkImportRowEditField";

export function BulkImportRowEditForm({ edit, mapping, options, context, rows, rowsReady }: {
  edit: ReturnType<typeof useAssetImportEdit>; mapping: ColumnMapping; options: ImportOptions;
  context: string; rows: ImportRow[]; rowsReady: boolean;
}) {
  const [rules, setRules] = useState<RegistrationOptions["referenceSelectors"] | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void refreshRegistrationOptions(context, controller.signal).then((options) => {
      if (!controller.signal.aborted) { setRules(options.referenceSelectors); setFailed(false); }
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [context, retry]);
  if (!rules) {
    return failed ? (
      <div role="alert" className="space-y-3 text-sm">
        <p>Couldn&apos;t load the field options.</p>
        <Button variant="outline" onClick={() => { setFailed(false); setRetry((value) => value + 1); }}>Try again</Button>
      </div>
    ) : (
      <div role="status" aria-label="Loading edit fields" className="space-y-4">
        {options.columns.filter((column) => mapping.includes(column.key)).map((column) => (
          <div key={column.key} className="space-y-2">
            <Skeleton className="h-4 w-24 motion-reduce:animate-none" />
            <Skeleton className="h-11 w-full motion-reduce:animate-none" />
            <div className="h-5" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div data-import-edit className="space-y-4">
      {edit.messages.length > 0 && (
        <section aria-label="Remaining issues" className="space-y-1 rounded-control border border-border bg-muted p-3">
          <h3 className="text-sm font-semibold">Remaining issues</h3>
          {edit.messages.map((message, index) => (
            <Button
              key={`${message.field}:${index}`} variant="link"
              className={`min-h-11 w-full justify-start whitespace-normal text-left text-xs ${message.severity === "error" ? "text-error" : "text-warning"}`}
              onClick={() => document.getElementById(`import-field-${message.field}`)?.querySelector<HTMLElement>("input,button")?.focus()}
            >
              <AlertCircleIcon aria-hidden="true" className="size-4 shrink-0" />
              <span>{message.message}</span>
            </Button>
          ))}
        </section>
      )}
      {edit.base.override && (
        <p className="text-xs text-muted-foreground">Saving clears the approval for this row.</p>
      )}
      <fieldset disabled={edit.saving} className="min-w-0 space-y-3">
        <legend className="sr-only">Mapped import fields</legend>
        {options.columns.filter((column) => mapping.includes(column.key)).map((column) => (
          <BulkImportRowEditField
            key={column.key} column={column} edit={edit} context={context} rules={rules}
            rows={rows} conditions={options.conditions} rowsReady={rowsReady}
          />
        ))}
      </fieldset>
      {edit.checkError && (
        <div role="alert" className="text-xs text-error">
          <p>{edit.checkError}</p>
          <Button variant="link" className="min-h-11" onClick={edit.retryCheck}>Try again</Button>
        </div>
      )}
    </div>
  );
}
