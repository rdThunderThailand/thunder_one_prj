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
  onFiles: (files: File[]) => void;
}

export function BulkImportFileDropzone({
  disabled,
  maxBytes,
  maxRows,
  feedbackId,
  onFiles,
}: BulkImportFileDropzoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const pasteHintId = useId();
  const [dragging, setDragging] = useState(false);

  return (
    <label
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Choose, drop or paste an XLSX or CSV file"
      aria-disabled={disabled}
      aria-describedby={[pasteHintId, feedbackId].filter(Boolean).join(" ")}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-control border border-dashed border-primary/30 bg-card p-4 text-center transition-colors focus-visible:bg-accent focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none",
        !disabled && !dragging && "hover:border-primary hover:bg-accent/30",
        dragging && !disabled && "border-primary bg-accent",
        disabled && "cursor-wait opacity-60",
      )}
      onClick={(event) => {
        if (!disabled) event.currentTarget.focus();
      }}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          input.current?.click();
        }
      }}
      onPaste={(event) => {
        event.preventDefault();
        if (disabled) return;
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
        if (!disabled && event.dataTransfer.types.includes("Files")) setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? "none" : "copy";
        if (!disabled && event.dataTransfer.types.includes("Files")) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDragEnd={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (disabled) return;
        event.currentTarget.focus();
        onFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <input
        ref={input}
        type="file"
        accept=".xlsx,.csv"
        aria-label="Choose an XLSX or CSV file"
        disabled={disabled}
        className="hidden"
        onChange={(event) => {
          onFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />
      <UploadIcon aria-hidden="true" className="size-8 text-primary" />
      <span className="block space-y-1">
        <span className="block text-sm font-semibold text-foreground">
          Drag and drop or paste your file here
        </span>
        <span className="block text-xs">
          or <u className="text-accent-foreground underline-offset-4">click to browse</u>
        </span>
      </span>
      <span className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs leading-relaxed tabular-nums text-muted-foreground">
        <span>XLSX or CSV UTF-8</span>
        <span>Up to {formatBytes(maxBytes)}</span>
        <span>Up to {formatCount(maxRows)} rows</span>
      </span>
      <span id={pasteHintId} className="text-xs leading-relaxed text-muted-foreground">
        Focus this area, then press Ctrl+V or ⌘V to paste a copied file.
      </span>
    </label>
  );
}
