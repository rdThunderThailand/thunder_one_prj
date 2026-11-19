"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { DownloadIcon, SpinnerIcon } from "@/components/ui/icons";
import type { ColumnMapping, ImportBatch } from "../../domain/asset-import-types";
import type { AssetImportApi } from "../../services/asset-import-api";
import { readAllImportRows } from "../../services/asset-import-edit";
import { downloadBlob } from "../../services/asset-import-template";

export function BulkImportCorrectedDownload({ api, batch, mapping, disabled }: {
  api: AssetImportApi; batch: ImportBatch; mapping: ColumnMapping; disabled?: boolean;
}) {
  const [progress, setProgress] = useState("");
  const lock = useRef(false);
  const alive = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; controller.current?.abort(); };
  }, []);
  // shortcut: the column mapping is not kept after Confirm, so a reloaded finished import cannot build the file; hide it until mapping recovery is decided.
  if (!batch.editedCount || !mapping.some(Boolean)) return null;
  async function download() {
    if (lock.current) return;
    lock.current = true;
    const request = new AbortController();
    controller.current = request;
    setProgress("Fetching source file…");
    try {
      const source = await api.sourceFileUrl(batch.id);
      const response = await fetch(source.url, { signal: request.signal, credentials: "omit", cache: "no-store" });
      if (!response.ok) throw new Error("Source download failed");
      const bytes = await response.arrayBuffer();
      if (batch.sourceFile && bytes.byteLength !== batch.sourceFile.sizeBytes) throw new Error("Source file size mismatch");
      const rows = await readAllImportRows(api, batch.id, request.signal);
      request.signal.throwIfAborted();
      const { buildCorrectedImport } = await import("../../services/asset-import-corrected");
      const file = await buildCorrectedImport(bytes, source.name, mapping, rows,
        (label) => { if (alive.current) setProgress(label); });
      if (alive.current) downloadBlob(file.blob, file.filename);
    } catch {
      if (alive.current) toast.error("Couldn't build the corrected file. Try again.");
    } finally {
      lock.current = false;
      if (alive.current) setProgress("");
    }
  }
  return (
    <div className="space-y-1">
      <Button variant="outline" size="sm" className="min-h-11" disabled={disabled || Boolean(progress)} onClick={() => void download()}>
        {progress ? (
          <SpinnerIcon aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
        ) : (
          <DownloadIcon aria-hidden="true" className="size-4" />
        )}
        <span>Download corrected file</span>
      </Button>
      <p role="status" className="min-h-4 text-xs text-muted-foreground">{progress}</p>
    </div>
  );
}
