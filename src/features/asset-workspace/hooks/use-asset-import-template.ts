"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ImportOptions } from "../domain/asset-import-types";
import type { AssetImportContext } from "../services/asset-import-api";
import { downloadBlob } from "../services/asset-import-template";

/** Shared by the registration entry and P1; a browser download has no saved-file receipt. */
export function useAssetImportTemplate(
  options: ImportOptions | null,
  context: AssetImportContext,
) {
  const [downloading, setDownloading] = useState(false);
  const locked = useRef(false);
  const alive = useRef(false);
  const contextKey = `${context.tenantId}:${context.userId}`;
  const activeContext = useRef(contextKey);

  useEffect(() => {
    activeContext.current = contextKey;
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, [contextKey]);

  async function downloadTemplate() {
    if (!options || locked.current) return;
    locked.current = true;
    setDownloading(true);
    const isCurrent = () => alive.current && activeContext.current === contextKey;
    try {
      const { createImportTemplate } = await import("../services/asset-import-xlsx-template");
      const file = await createImportTemplate(options, context);
      if (!isCurrent()) return;
      downloadBlob(file.blob, file.filename);
      if (file.referenceUnavailable) toast.warning("Reference list could not be added.");
    } catch {
      if (isCurrent()) toast.error("The template could not be created. Try again.");
    } finally {
      locked.current = false;
      if (alive.current) setDownloading(false);
    }
  }

  return { downloading, downloadTemplate };
}
