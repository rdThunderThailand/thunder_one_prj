"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentFolder } from "@/types/domain";
import { fetchContentFolders } from "@/lib/api/media-api";
import { uploadAndRegisterAsset } from "@/features/media-workspace/publications/services/upload-api";
import {
  MAX_WORKERS,
  aggregateAction,
  nextToStart,
  stageFiles,
  summarize,
  type UploadItem,
} from "./upload-queue";

let nextId = 0;
const newId = () => String(nextId++);

export function useUploadQueue() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  // Ids already handed to a worker — guards the reconcile effect from double-starting a
  // file between "start" firing and the `uploading` state landing (no sync setState in
  // an effect body, so this has to be a ref, not state).
  const startedIds = useRef<Set<string>>(new Set());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    fetchContentFolders("asset").then(setFolders).catch(() => setFolders([]));
  }, []);

  const addFiles = useCallback((files: File[]) => {
    setItems((current) => {
      const { items: next, rejections: nextRejections } = stageFiles(
        current,
        files.map((file) => ({ id: newId(), file }))
      );
      setRejections(nextRejections);
      return next;
    });
  }, []);

  const runItem = useCallback((id: string, file: File) => {
    const controller = new AbortController();
    abortControllers.current.set(id, controller);

    // Deferred to a microtask so the effect that triggers this never calls setState
    // synchronously in its own body (ESLint react-hooks/set-state-in-effect).
    Promise.resolve()
      .then(() => {
        setItems((current) => current.map((item) => (item.id === id ? { ...item, state: "uploading", pct: 0 } : item)));
        return uploadAndRegisterAsset(file, {
          folderId,
          signal: controller.signal,
          onProgress: (pct) => setItems((current) => current.map((item) => (item.id === id ? { ...item, pct } : item))),
        });
      })
      .then(() => {
        setItems((current) => current.map((item) => (item.id === id ? { ...item, state: "completed", pct: 100 } : item)));
      })
      .catch((error: unknown) => {
        const isAbort = error instanceof Error && error.name === "AbortError";
        const message = error instanceof Error ? error.message : "Upload failed";
        setItems((current) =>
          current.map((item) => (item.id === id ? { ...item, state: isAbort ? "canceled" : "failed", error: message } : item))
        );
      })
      .finally(() => {
        abortControllers.current.delete(id);
        startedIds.current.delete(id);
      });
  }, [folderId]);

  // The whole two-worker scheduler: after every state change, start whatever
  // `nextToStart` says should run. A failed/canceled item stops counting as active on
  // its own, so no separate "release the slot" step is needed anywhere else.
  useEffect(() => {
    if (!started) return;
    for (const id of nextToStart(items, MAX_WORKERS)) {
      if (startedIds.current.has(id)) continue;
      startedIds.current.add(id);
      const item = items.find((entry) => entry.id === id);
      if (item) runItem(id, item.file as File);
    }
  }, [items, started, runItem]);

  useEffect(() => {
    const hasActiveWork = items.some((item) => item.state === "waiting" || item.state === "uploading");
    if (!hasActiveWork) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [items]);

  const startUpload = useCallback(() => {
    setStarted(true);
    setItems((current) => current.map((item) => (item.state === "staged" ? { ...item, state: "waiting" } : item)));
  }, []);

  const cancelItem = useCallback((id: string) => {
    abortControllers.current.get(id)?.abort();
    setItems((current) =>
      current.map((item) => (item.id === id && item.state === "waiting" ? { ...item, state: "canceled" } : item))
    );
  }, []);

  const retryItem = useCallback((id: string) => {
    startedIds.current.delete(id);
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, state: "waiting", pct: 0, error: undefined } : item))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const runAggregateAction = useCallback(() => {
    const action = aggregateAction(items);
    if (action === "clear-queue") {
      setItems((current) => current.filter((item) => item.state !== "staged"));
    } else if (action === "cancel-all") {
      for (const item of items) {
        if (item.state === "uploading" || item.state === "waiting") {
          abortControllers.current.get(item.id)?.abort();
        }
      }
      setItems((current) =>
        current.map((item) => (item.state === "waiting" ? { ...item, state: "canceled" } : item))
      );
    } else if (action === "clear-all") {
      setItems((current) =>
        current.filter((item) => item.state !== "completed" && item.state !== "failed" && item.state !== "canceled")
      );
    }
  }, [items]);

  return {
    items,
    rejections,
    folders,
    folderId,
    setFolderId,
    started,
    summary: summarize(items),
    aggregateAction: aggregateAction(items),
    addFiles,
    startUpload,
    cancelItem,
    retryItem,
    removeItem,
    runAggregateAction,
  };
}
