"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ContentFolder, Tag, TranscodeStatus } from "@/types/domain";
import { useTranscodeStatus } from "../use-transcode-status";
import { fetchContentFolders, fetchTags } from "@/lib/api/media-api";
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
  settleConverting,
  startItems,
  stageFiles,
  summarize,
  uploadOutcome,
  type UploadItem,
} from "./upload-queue";

let nextId = 0;
const newId = () => String(nextId++);

export function useUploadQueue(initialFolderId: string | null = null) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [rejections, setRejections] = useState<string[]>([]);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [folderId, setFolderId] = useState<string | null>(initialFolderId);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [started, setStarted] = useState(false);

  // Ids already handed to a worker — guards the reconcile effect from double-starting a
  // file between "start" firing and the `uploading` state landing (no sync setState in
  // an effect body, so this has to be a ref, not state).
  const startedIds = useRef<Set<string>>(new Set());
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    fetchContentFolders("asset").then(setFolders).catch(() => setFolders([]));
    fetchTags().then(setTags).catch(() => setTags([]));
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
    // A cancel frees this row's slot at once and a Retry can start a new run before this one
    // settles, so only the run that still owns the row may write to it.
    const isCurrent = () => abortControllers.current.get(id) === controller;
    const patchOwn = (patch: (item: UploadItem) => UploadItem) => {
      if (isCurrent()) patchItem(id, patch);
    };

    // Deferred to a microtask so the effect that triggers this never calls setState
    // synchronously in its own body (ESLint react-hooks/set-state-in-effect).
    Promise.resolve()
      .then(() => {
        patchItem(id, (item) => ({ ...item, state: "uploading", pct: entry.target ? item.pct : 0 }));
        return uploadAndRegisterAsset(entry.file as File, {
          title: entry.title,
          folderId,
          tagIds: entry.tagIds,
          signal: controller.signal,
          // Present only on a retry that may resume; the first attempt authorizes here and
          // reports the target back so a later retry has something to resume against.
          target: entry.target,
          // Present only on a retry after the bytes landed: it registers again, nothing more.
          registration: entry.registration,
          onTarget: (target) => patchOwn((item) => ({ ...item, target })),
          onTransferred: (registration) => patchOwn((item) => ({ ...item, registration })),
          onProgress: (pct) => patchOwn((item) => ({ ...item, pct })),
        });
      })
      .then((registered) => {
        // ADR 0070/0071: a resolved register call is not automatically success — the backend
        // already judged the file on intake (see uploadOutcome for the failed/processing/ready
        // branches).
        const outcome = uploadOutcome(registered.status, registered.probe_verdict);
        patchOwn((item) => ({
          ...item,
          state: outcome.state,
          pct: 100,
          error: undefined,
          readiness: outcome.readiness ?? undefined,
          assetId: registered.media_asset_id,
        }));
      })
      .catch((error: unknown) => {
        const name = error instanceof Error ? error.name : "";
        const message = error instanceof Error ? error.message : "Upload failed";
        patchOwn((item) => ({
          ...item,
          state: name === "AbortError" ? "canceled" : "failed",
          error: name === "AbortError" ? undefined : message,
          // Storage has lost the resumable session, so the stored target can no longer be
          // resumed — the next retry re-authorizes this file and only this file. The `files`
          // row it reserved does still exist, so the target is kept for releasing.
          isReservationDead: item.isReservationDead || name === EXPIRED_UPLOAD_ERROR,
        }));
      })
      .finally(() => {
        if (!isCurrent()) return;
        abortControllers.current.delete(id);
        startedIds.current.delete(id);
      });
  }, [folderId, patchItem]);

  // The whole scheduler: after every state change, start whatever
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
    setItems((current) => startItems(current, selectedTagIds));
  }, [selectedTagIds]);

  // Cancelling releases the reservation server-side, so a file abandoned mid-upload leaves no
  // Asset and no waiting Storage object. `isReservationDead` is set in the same update: the
  // row's own catch handler must not release it a second time, and a later Retry has to
  // re-authorize rather than resume against a reservation Core has just canceled.
  const cancelItem = useCallback((id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    // Once the bytes are in Storage the registration request is on its way and cannot be
    // withdrawn; it ends as Completed or Failed within its own time bound.
    if (item.state === "uploading" && item.registration) return;
    abortControllers.current.get(id)?.abort();
    releaseReservation(reservationToRelease(item));
    patchItem(id, (entry) => ({
      ...entry,
      // Core has released it, so there is nothing left to resume against and nothing left to
      // cancel — dropping the target keeps a later Retry from asking Core to cancel it twice.
      isReservationDead: true,
      target: undefined,
      registration: undefined,
      // Canceled at once, in every stage: a row still preparing would otherwise hold its slot
      // until the decoder answered.
      state: "canceled",
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
      // Kept only with the reservation it belongs to; a restart uploads the bytes again.
      registration: plan.registration,
    }));
  }, [items, patchItem, releaseReservation]);

  const removeItem = useCallback((id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (item) releaseReservation(reservationToRelease(item));
    setItems((current) => current.filter((entry) => entry.id !== id));
  }, [items, releaseReservation]);

  const renameItem = useCallback((id: string, title: string) => {
    patchItem(id, (item) => ({ ...item, title: title.slice(0, 200) }));
  }, [patchItem]);

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

  const applySettled = useCallback(({ asset_id: assetId, status }: TranscodeStatus) => {
    setItems((current) => current.map((item) => (item.assetId === assetId ? settleConverting(item, status) : item)));
  }, []);
  const convertingIds = items.flatMap((item) => (item.readiness === "converting" && item.assetId ? [item.assetId] : []));
  const transcode = useTranscodeStatus(convertingIds, applySettled);

  return {
    transcode,
    items,
    rejections,
    folders,
    tags,
    folderId,
    setFolderId,
    selectedTagIds,
    setSelectedTagIds,
    started,
    summary: summarize(items),
    aggregateAction: aggregateAction(items),
    addFiles,
    startUpload,
    cancelItem,
    retryItem,
    removeItem,
    renameItem,
    runAggregateAction,
  };
}
