"use client";

import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { UploadIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { formatBytes, formatCount } from "../../domain/asset-import-format";

interface BulkImportFileDropzoneProps {
  disabled: boolean;
  maxBytes: number;
  maxRows: number;
  feedbackId?: string;
  /** A file is already read: the zone stays visible (design) but only Remove on the file card replaces it. */
  selectedName?: string;
  onFiles: (files: File[]) => void;
}

export function BulkImportFileDropzone({
  disabled,
  maxBytes,
  maxRows,
  feedbackId,
  selectedName,
  onFiles,
}: BulkImportFileDropzoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const pasteHintId = useId();
  const [dragging, setDragging] = useState(false);
  const occupied = Boolean(selectedName);
  const blocked = disabled || occupied;

  return (
    <label
      role="button"
      tabIndex={blocked ? -1 : 0}
      aria-label={occupied ? `${selectedName} is selected. Remove it to choose another file` : "Choose, drop or paste an XLSX or CSV file"}
      aria-disabled={blocked}
      aria-describedby={[!occupied && pasteHintId, feedbackId].filter(Boolean).join(" ")}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed border-primary/30 bg-card p-4 text-center transition-colors focus-visible:bg-accent focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none",
        !blocked && !dragging && "hover:border-primary hover:bg-accent/30",
        dragging && !blocked && "border-primary bg-accent",
        occupied && "cursor-default border-border bg-muted/40",
        disabled && !occupied && "cursor-wait opacity-60",
      )}
      onClick={(event) => {
        if (!blocked) event.currentTarget.focus();
      }}
      onKeyDown={(event) => {
        if (!blocked && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          input.current?.click();
        }
      }}
      onPaste={(event) => {
        event.preventDefault();
        if (blocked) return;
        const files = Array.from(event.clipboardData.files);
        if (files.length === 0) {
          for (const item of Array.from(event.clipboardData.items)) {
            if (item.kind !== "file") continue;
            const file = item.getAsFile();
            if (file) files.push(file);
          }
        }
        if (files.length === 0) {
          toast.info("Paste a copied XLSX or CSV file, or click to browse.");
          return;
        }
        onFiles(files);
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!blocked && event.dataTransfer.types.includes("Files")) setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = blocked ? "none" : "copy";
        if (!blocked && event.dataTransfer.types.includes("Files")) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDragEnd={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (blocked) return;
        event.currentTarget.focus();
        onFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <input
        ref={input}
        type="file"
        accept=".xlsx,.csv"
        aria-label="Choose an XLSX or CSV file"
        disabled={blocked}
        className="hidden"
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <UploadIcon aria-hidden="true" className={cn("size-8", occupied ? "text-muted-foreground" : "text-primary")} />
      {occupied ? (
        <span className="block space-y-1">
          <span className="block text-sm font-semibold text-foreground">
            One file at a time
          </span>
          <span className="block text-xs text-muted-foreground">
            Remove the selected file below to choose another.
          </span>
        </span>
      ) : (
        <span className="block space-y-1">
          <span className="block text-sm font-semibold text-foreground">
            Drag and drop or paste your file here
          </span>
          <span className="block text-xs">
            or <u className="text-accent-foreground underline-offset-4">click to browse</u>
          </span>
        </span>
      )}
      <span className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs leading-relaxed tabular-nums text-muted-foreground">
        <span>XLSX or CSV UTF-8</span>
        <span>Up to {formatBytes(maxBytes)}</span>
        <span>Up to {formatCount(maxRows)} rows</span>
      </span>
      {!occupied && (
        <span id={pasteHintId} className="text-xs leading-relaxed text-muted-foreground">
          Focus this area, then press Ctrl+V or ⌘V to paste a copied file.
        </span>
      )}
    </label>
  );
}
