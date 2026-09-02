"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentFolder } from "@/types/domain";
import { fetchContentFolders } from "@/lib/api/media-api";
import {
  EXPIRED_UPLOAD_ERROR,
  cancelUploadReservation,
  uploadAndRegisterAsset,
  type UploadTarget,
} from "@/features/media-workspace/publications/services/upload-api";
import {
  MAX_WORKERS,
  aggregateAction,
  nextToStart,
  reservationToRelease,
  retryPlan,
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

  // Releasing a reservation is best-effort cleanup: the file is already terminal in the queue
  // either way, and the nightly sweep is the backstop when this call cannot get through.
  const releaseReservation = useCallback((target: UploadTarget | undefined) => {
    if (target) void cancelUploadReservation(target.file_id).catch(() => {});
  }, []);

  const patchItem = useCallback((id: string, patch: (item: UploadItem) => UploadItem) => {
    setItems((current) => current.map((item) => (item.id === id ? patch(item) : item)));
  }, []);

  const runItem = useCallback((entry: UploadItem) => {
    const id = entry.id;
    const controller = new AbortController();
    abortControllers.current.set(id, controller);

    // Deferred to a microtask so the effect that triggers this never calls setState
    // synchronously in its own body (ESLint react-hooks/set-state-in-effect).
    Promise.resolve()
      .then(() => {
        patchItem(id, (item) => ({ ...item, state: "uploading", pct: entry.target ? item.pct : 0 }));
        return uploadAndRegisterAsset(entry.file as File, {
          folderId,
          signal: controller.signal,
          // Present only on a retry that may resume; the first attempt authorizes here and
          // reports the target back so a later retry has something to resume against.
          target: entry.target,
          onTarget: (target) => patchItem(id, (item) => ({ ...item, target })),
          onProgress: (pct) => patchItem(id, (item) => ({ ...item, pct })),
        });
      })
      .then(() => {
        patchItem(id, (item) => ({ ...item, state: "completed", pct: 100 }));
      })
      .catch((error: unknown) => {
        const name = error instanceof Error ? error.name : "";
        const message = error instanceof Error ? error.message : "Upload failed";
        patchItem(id, (item) => ({
          ...item,
          state: name === "AbortError" ? "canceled" : "failed",
          error: message,
          // Storage has lost the resumable session, so the stored target can no longer be
          // resumed — the next retry re-authorizes this file and only this file. The `files`
          // row it reserved does still exist, so the target is kept for releasing.
          isReservationDead: item.isReservationDead || name === EXPIRED_UPLOAD_ERROR,
        }));
      })
      .finally(() => {
        abortControllers.current.delete(id);
        startedIds.current.delete(id);
      });
  }, [folderId, patchItem]);

  // The whole two-worker scheduler: after every state change, start whatever
  // `nextToStart` says should run. A failed/canceled item stops counting as active on
  // its own, so no separate "release the slot" step is needed anywhere else.
  useEffect(() => {
    if (!started) return;
    for (const id of nextToStart(items, MAX_WORKERS)) {
      if (startedIds.current.has(id)) continue;
      startedIds.current.add(id);
      const item = items.find((entry) => entry.id === id);
      if (item) runItem(item);
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

  // Cancelling releases the reservation server-side, so a file abandoned mid-upload leaves no
  // Asset and no waiting Storage object. `isReservationDead` is set in the same update: the
  // row's own catch handler must not release it a second time, and a later Retry has to
  // re-authorize rather than resume against a reservation Core has just canceled.
  const cancelItem = useCallback((id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    abortControllers.current.get(id)?.abort();
    releaseReservation(reservationToRelease(item));
    patchItem(id, (entry) => ({
      ...entry,
      // Core has released it, so there is nothing left to resume against and nothing left to
      // cancel — dropping the target keeps a later Retry from asking Core to cancel it twice.
      isReservationDead: true,
      target: undefined,
      state: entry.state === "waiting" ? "canceled" : entry.state,
    }));
  }, [items, patchItem, releaseReservation]);

  const retryItem = useCallback((id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    const plan = retryPlan(item);
    releaseReservation(plan.release);
    startedIds.current.delete(id);
    patchItem(id, (entry) => ({
      ...entry,
      state: "waiting",
      error: undefined,
      isReservationDead: false,
      // A resume keeps the bar where it stopped; a restart honestly returns to zero.
      pct: plan.shouldResume ? entry.pct : 0,
      target: plan.shouldResume ? entry.target : undefined,
    }));
  }, [items, patchItem, releaseReservation]);

  const removeItem = useCallback((id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (item) releaseReservation(reservationToRelease(item));
    setItems((current) => current.filter((entry) => entry.id !== id));
  }, [items, releaseReservation]);

  const runAggregateAction = useCallback(() => {
    const action = aggregateAction(items);
    if (action === "clear-queue") {
      setItems((current) => current.filter((item) => item.state !== "staged"));
    } else if (action === "cancel-all") {
      for (const item of items) {
        if (item.state === "uploading" || item.state === "waiting") cancelItem(item.id);
      }
    } else if (action === "clear-all") {
      for (const item of items) releaseReservation(reservationToRelease(item));
      setItems((current) =>
        current.filter((item) => item.state !== "completed" && item.state !== "failed" && item.state !== "canceled")
      );
    }
  }, [items, cancelItem, releaseReservation]);

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
