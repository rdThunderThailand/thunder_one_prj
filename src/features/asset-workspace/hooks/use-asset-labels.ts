"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AssetActionError } from "../domain/asset-action-error";
import { assertLabelFormat, DEFAULT_LABEL_FIELDS, DEFAULT_LABEL_FORMAT, labelFailure, labelScope, type AssetLabel, type LabelCandidate, type LabelField, type LabelFields, type LabelFormat } from "../domain/asset-labels";
import { prepareAssetLabels } from "../services/asset-label-preparation";
import { downloadBlob } from "../services/asset-import-template";
import { printAssetLabelsPdf } from "../services/asset-label-print";

type LabelFile = { blob: Blob; filename: string };
type LabelState = {
  key: string; scope: LabelCandidate[]; labels: AssetLabel[];
  phase: "loading" | "preview" | "generating" | "ready" | "error" | null;
  completed: number; file: LabelFile | null; error: AssetActionError | null;
  preparation: { tools: boolean; data: boolean };
  format: LabelFormat;
  fields: LabelFields;
};
const empty = (key: string): LabelState => ({
  key, scope: [], labels: [], phase: null, completed: 0, file: null, error: null, format: DEFAULT_LABEL_FORMAT, fields: DEFAULT_LABEL_FIELDS,
  preparation: { tools: false, data: false },
});

/** Same account/query, abort and focus lifecycle as useAssetExport. No result survives a scope change. */
export function useAssetLabels(context: string, viewKey: string) {
  const key = `${context}:${viewKey}`;
  const [state, setState] = useState(() => empty(key));
  const scopeRef = useRef<{ key: string; active: boolean } | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  if (state.key !== key) setState(empty(key));
  const current = state.key === key ? state : empty(key);

  useLayoutEffect(() => {
    const guard = { key, active: true };
    scopeRef.current = guard;
    return () => { guard.active = false; controllerRef.current?.abort(); controllerRef.current = null; };
  }, [key]);

  function close() {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState(empty(key));
  }

  async function load(scope: LabelCandidate[]) {
    const guard = scopeRef.current;
    if (!guard?.active || guard.key !== key || controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    const isCurrent = () => guard.active && controllerRef.current === controller && !controller.signal.aborted;
    setState({ ...empty(key), scope, phase: "loading" });
    try {
      const labels = await prepareAssetLabels(context, scope, controller.signal, (step) => {
        if (isCurrent()) setState((previous) => ({
          ...previous, preparation: { ...previous.preparation, [step]: true },
        }));
      });
      if (isCurrent()) setState({ ...empty(key), scope, labels, phase: "preview", preparation: { tools: true, data: true } });
    } catch (error) {
      if (isCurrent()) setState({ ...empty(key), scope, phase: "error", error: labelFailure(error, scope) });
      controller.abort();
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  function open(candidates: LabelCandidate[], trigger: HTMLElement | null): boolean {
    if (controllerRef.current) return false;
    if (!candidates.length) { toast.info("Select assets first to generate labels."); return false; }
    triggerRef.current = trigger;
    try { void load(labelScope(candidates)); }
    catch (error) { setState({ ...empty(key), phase: "error", error: labelFailure(error, candidates) }); }
    return true;
  }

  function setFormat(format: LabelFormat) {
    // "ready" too: the FE 06 page keeps settings on screen after a PDF; the dialog shows them only in preview.
    if ((current.phase !== "preview" && current.phase !== "ready") || controllerRef.current) return;
    let error: AssetActionError | null = null;
    try { assertLabelFormat(current.labels, format); }
    catch (failure) { error = labelFailure(failure, current.scope); }
    setState({ ...current, phase: "preview", format, file: null, completed: 0, error });
  }

  function setField(field: LabelField, checked: boolean) {
    // "ready" too: the FE 06 page keeps settings on screen after a PDF; the dialog shows them only in preview.
    if ((current.phase !== "preview" && current.phase !== "ready") || controllerRef.current) return;
    setState({ ...current, phase: "preview", fields: { ...current.fields, [field]: checked }, file: null, completed: 0 });
  }

  /** `copies` repeats each label page (FE 06); callers without it get one page per asset as before. */
  async function generate(copies = 1) {
    const guard = scopeRef.current;
    if (!current.labels.length || controllerRef.current || !guard?.active || guard.key !== key) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    const isCurrent = () => guard.active && controllerRef.current === controller && !controller.signal.aborted;
    setState({ ...current, phase: "generating", completed: 0, error: null, file: null });
    try {
      const { createAssetLabelsPdf } = await import("../services/asset-label-pdf");
      controller.signal.throwIfAborted();
      const pages = current.labels.flatMap((label) => Array.from({ length: copies }, () => label));
      const file = await createAssetLabelsPdf(pages, current.format, current.fields, controller.signal, (completed) => {
        if (isCurrent()) setState((previous) => ({ ...previous, completed }));
      });
      if (isCurrent()) setState({ ...current, phase: "ready", completed: pages.length + 1, file, error: null });
    } catch (error) {
      if (isCurrent()) setState({ ...current, phase: "preview", file: null,
        error: new AssetActionError(error instanceof AssetActionError ? error.message : "The PDF could not be generated. Try again.") });
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  function download() {
    if (!current.file) return;
    try { downloadBlob(current.file.blob, current.file.filename); }
    catch { setState({ ...current, error: new AssetActionError("The download could not start. Try again.") }); }
  }

  function print() {
    if (!current.file) return;
    try {
      printAssetLabelsPdf(current.file.blob);
    } catch { setState({ ...current, error: new AssetActionError("Allow pop-ups to open the PDF, or download it and print from your PDF viewer.") }); }
  }

  return { ...current, open, close, setFormat, setField, generate, download, print,
    retry: () => void load(current.scope), restoreFocus: () => triggerRef.current?.focus() };
}

export type AssetLabelsFlow = ReturnType<typeof useAssetLabels>;
