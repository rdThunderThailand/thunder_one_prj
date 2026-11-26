"use client";

import { useState } from "react";
import { DownloadIcon, SpinnerIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/lovable/dialog";
import { formatCount } from "../../domain/asset-import-format";
import type { ErrorFileFormat } from "../../hooks/use-asset-import-files";

const FORMATS: { value: ErrorFileFormat; label: string; hint: string }[] = [
  { value: "xlsx", label: "Excel (.xlsx)", hint: "Best for editing in Excel" },
  { value: "csv", label: "CSV (.csv)", hint: "Plain text for any spreadsheet app" },
];

export function BulkImportErrorFileDialog({ reimport, rowCount, busy, onDownload, onClose }: {
  reimport: boolean;
  rowCount: number;
  busy: boolean;
  onDownload: (format: ErrorFileFormat) => void;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<ErrorFileFormat>("xlsx");
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md gap-4 rounded-card bg-card sm:rounded-card">
        <div className="space-y-1">
          <DialogTitle className="text-lg">
            {reimport ? "Fix Errors and Re-import" : "Download Error File"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            The file has {formatCount(rowCount)} {rowCount === 1 ? "row" : "rows"} to fix. Keep the Import ID and Source Row columns so it can be re-imported.
          </DialogDescription>
        </div>
        <fieldset className="space-y-2">
          <legend className="sr-only">File format</legend>
          {FORMATS.map(({ value, label, hint }) => (
            <label
              key={value}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-control border border-border p-3 has-checked:border-primary has-checked:bg-info-muted has-focus-visible:ring-2 has-focus-visible:ring-ring"
            >
              <input
                type="radio"
                name="error-file-format"
                value={value}
                checked={format === value}
                onChange={() => setFormat(value)}
                className="size-4 shrink-0 accent-primary"
              />
              <span className="min-w-0">
                <span className="block text-xs font-semibold">{label}</span>
                <span className="block text-2xs text-muted-foreground">{hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={busy} onClick={() => onDownload(format)}>
            {busy ? (
              <SpinnerIcon className="size-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <DownloadIcon className="size-4" />
            )}
            <span>Download</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
