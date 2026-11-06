"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { requestErrorText } from "../domain/asset-import-messages";
import { getAssetImportApi, ImportApiError } from "../services/asset-import-api";
import { downloadBlob } from "../services/asset-import-template";
import type { ImportTemplateStage } from "../services/asset-import-xlsx-template";

type TemplateState = { context: string; stage: "settings" | ImportTemplateStage | null; error: string | null };
const empty = (context: string): TemplateState => ({ context, stage: null, error: null });

/** The list only loads import settings when the user requests a template. */
export function useAssetsListTemplate(context: string) {
  const [state, setState] = useState(() => empty(context));
  const guardRef = useRef<{ active: boolean } | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  if (state.context !== context) setState(empty(context));
  const current = state.context === context ? state : empty(context);

  useLayoutEffect(() => {
    const guard = { active: true };
    guardRef.current = guard;
    return () => {
      guard.active = false;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [context]);

  function cancel() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState(empty(context));
  }

  async function download(trigger?: HTMLElement | null) {
    const guard = guardRef.current;
    if (!guard?.active || controllerRef.current) return;
    if (trigger) triggerRef.current = trigger;
    const controller = new AbortController();
    controllerRef.current = controller;
    const isCurrent = () => guard.active && controllerRef.current === controller && !controller.signal.aborted;
    setState({ context, stage: "settings", error: null });
    try {
      const [tenantId, userId] = context.split(":");
      const importContext = { tenantId, userId };
      const options = await getAssetImportApi(importContext).getOptions();
      if (!isCurrent()) return;
      if (!options.ready) {
        throw new ImportApiError("IMPORT_UNAVAILABLE", "Bulk import is not available yet.");
      }
      const { createImportTemplate } = await import("../services/asset-import-xlsx-template");
      if (!isCurrent()) return;
      const file = await createImportTemplate(options, importContext, undefined, async (stage) => {
        if (!isCurrent()) throw new DOMException("Template preparation cancelled", "AbortError");
        setState({ context, stage, error: null });
        if (stage === "workbook") {
          // Paint the real stage before XLSX performs its synchronous serialization.
          await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
        }
        if (!isCurrent()) throw new DOMException("Template preparation cancelled", "AbortError");
      });
      if (!isCurrent()) return;
      downloadBlob(file.blob, file.filename);
      setState(empty(context));
      if (file.referenceUnavailable) toast.warning("Reference list could not be added.");
    } catch (error) {
      if (!isCurrent()) return;
      const message = error instanceof ImportApiError && ([401, 403].includes(error.status) || error.code === "IMPORT_UNAVAILABLE")
        ? requestErrorText(error.code, error.status)
        : "The template could not be created. Try again.";
      setState({ context, stage: null, error: message });
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  return { ...current, pending: current.stage !== null, download, cancel, restoreFocus: () => triggerRef.current?.focus() };
}

export type AssetsListTemplateFlow = ReturnType<typeof useAssetsListTemplate>;
