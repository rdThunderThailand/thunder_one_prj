"use client";

import { useRef, type DragEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UploadIcon } from "@/components/ui/icons";
import { UPLOAD_ACCEPT_ATTR, UPLOAD_ACCEPT_LABEL, MAX_UPLOAD_SIZE_LABEL } from "@/features/media-workspace/publications/upload-limits";
import { MAX_QUEUE_FILES, type UploadItemState } from "./upload-queue";
import { useUploadQueue } from "./useUploadQueue";

const STATE_LABEL: Record<UploadItemState, string> = {
  staged: "Staged",
  waiting: "Waiting",
  uploading: "Uploading",
  completed: "Completed",
  failed: "Failed",
  canceled: "Canceled",
};

const AGGREGATE_LABEL = {
  "clear-queue": "Clear Queue",
  "cancel-all": "Cancel All",
  "clear-all": "Clear All",
} as const;

export function UploadQueuePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queue = useUploadQueue();

  const onFilesPicked = (fileList: FileList | null) => {
    if (!fileList) return;
    queue.addFiles(Array.from(fileList));
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onFilesPicked(event.dataTransfer.files);
  };

  const canStart = queue.items.some((item) => item.state === "staged") && queue.folderId !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">Upload Assets</h1>
          <p className="mt-1 text-sm text-zinc-500">Stage up to {MAX_QUEUE_FILES} files, assign a Folder, then start.</p>
        </div>
        <Link href="/media-workspace/assets" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          Back to Media Library
        </Link>
      </div>

      <Card className="p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700"
          >
            <UploadIcon className="h-6 w-6 text-zinc-400" />
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Drag files here, or</p>
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={UPLOAD_ACCEPT_ATTR}
              className="hidden"
              onChange={(event) => {
                onFilesPicked(event.target.files);
                event.target.value = "";
              }}
            />
            <p className="text-xs text-zinc-400">
              {UPLOAD_ACCEPT_LABEL} · up to {MAX_UPLOAD_SIZE_LABEL} · up to {MAX_QUEUE_FILES} files
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">Folder</label>
              <select
                value={queue.folderId ?? ""}
                onChange={(event) => queue.setFolderId(event.target.value || null)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="" disabled>
                  Select a Folder
                </option>
                {queue.folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            <Button className="w-full" disabled={!canStart} onClick={queue.startUpload}>
              Start Upload
            </Button>
            <button
              disabled
              title="Coming in Phase 2"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-700"
            >
              Add from Source · Coming in Phase 2
            </button>
          </div>
        </div>
      </Card>

      {queue.rejections.length > 0 && (
        <div className="space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {queue.rejections.map((reason) => (
            <p key={reason}>{reason}</p>
          ))}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="text-sm text-zinc-500">
            {queue.summary.total === 0
              ? "No files staged"
              : `${queue.summary.completed}/${queue.summary.total} completed · ${queue.summary.uploading} uploading · ${queue.summary.waiting} waiting`}
          </div>
          {queue.aggregateAction && (
            <Button variant="secondary" onClick={queue.runAggregateAction}>
              {AGGREGATE_LABEL[queue.aggregateAction]}
            </Button>
          )}
        </div>

        {queue.items.length === 0 ? (
          <p className="py-16 text-center text-sm text-zinc-500">Choose or drop files to stage them.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {queue.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.file.name}</p>
                  <p className="text-xs text-zinc-500">
                    {STATE_LABEL[item.state]}
                    {item.state === "uploading" && ` · ${item.pct}%`}
                    {item.error && ` · ${item.error}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2 text-sm">
                  {item.state === "staged" && (
                    <button className="text-zinc-500 hover:text-red-600" onClick={() => queue.removeItem(item.id)}>
                      Remove
                    </button>
                  )}
                  {(item.state === "waiting" || item.state === "uploading") && (
                    <button className="text-zinc-500 hover:text-red-600" onClick={() => queue.cancelItem(item.id)}>
                      Cancel
                    </button>
                  )}
                  {(item.state === "failed" || item.state === "canceled") && (
                    <>
                      <button className="font-medium text-indigo-600" onClick={() => queue.retryItem(item.id)}>
                        Retry
                      </button>
                      <button className="text-zinc-500" onClick={() => queue.removeItem(item.id)}>
                        Dismiss
                      </button>
                    </>
                  )}
                  {item.state === "completed" && (
                    <button className="text-zinc-500" onClick={() => queue.removeItem(item.id)}>
                      Dismiss
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
