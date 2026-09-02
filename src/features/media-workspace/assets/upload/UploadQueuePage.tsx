"use client";

import { useRef, type DragEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckCircleIcon, LightbulbIcon, UploadIcon } from "@/components/ui/icons";
import { formatBytes } from "@/features/media-workspace/playlists/totals";
import { MAX_UPLOAD_SIZE_LABEL, UPLOAD_ACCEPT_ATTR, UPLOAD_ACCEPT_LABEL } from "@/features/media-workspace/publications/upload-limits";
import { MAX_QUEUE_FILES, type UploadItemState } from "./upload-queue";
import { RecentUploadsCard } from "./RecentUploadsCard";
import { useUploadQueue } from "./useUploadQueue";

const STATE_LABEL: Record<UploadItemState, string> = {
  staged: "Ready",
  waiting: "Waiting",
  uploading: "Uploading",
  completed: "Completed",
  failed: "Failed",
  canceled: "Canceled",
};

const STATE_TONE: Record<UploadItemState, string> = {
  staged: "text-zinc-500",
  waiting: "text-amber-600 dark:text-amber-400",
  uploading: "text-indigo-600 dark:text-indigo-400",
  completed: "text-emerald-600 dark:text-emerald-400",
  failed: "text-red-600 dark:text-red-400",
  canceled: "text-zinc-500",
};

const AGGREGATE_LABEL = {
  "clear-queue": "Clear Queue",
  "cancel-all": "Cancel All",
  "clear-all": "Clear All",
} as const;

export function UploadQueuePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queue = useUploadQueue();
  const canStart = queue.items.some((item) => item.state === "staged") && queue.folderId !== null;
  const settingsLocked = queue.items.some((item) => item.state === "waiting" || item.state === "uploading");

  const addTag = (tagId: string) => {
    if (!tagId || queue.selectedTagIds.includes(tagId)) return;
    queue.setSelectedTagIds([...queue.selectedTagIds, tagId]);
  };

  const onFilesPicked = (fileList: FileList | null) => {
    if (fileList) queue.addFiles(Array.from(fileList));
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onFilesPicked(event.dataTransfer.files);
  };

  const runAggregateAction = () => {
    const action = queue.aggregateAction;
    if (!action) return;
    if (action === "clear-queue" || window.confirm(`${AGGREGATE_LABEL[action]}? Uploaded data for in-progress files will be deleted.`)) queue.runAggregateAction();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500"><Link href="/media-workspace/assets" className="hover:text-indigo-600">Media Library</Link><span aria-hidden="true">/</span><span>Upload Media</span></div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">Upload Media</h1>
          <p className="mt-1 text-sm text-zinc-500">Upload and manage your media assets.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled title="Coming in Phase 2">Add from Source · Phase 2</Button>
          <Button disabled={!canStart} onClick={queue.startUpload}><UploadIcon /> Start Upload</Button>
        </div>
      </div>

      {queue.rejections.length > 0 && (
        <div className="space-y-1 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" role="alert">
          {queue.rejections.map((reason) => <p key={reason}>{reason}</p>)}
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0 space-y-5">
          <Card className="p-4">
            <div onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className="flex min-h-60 flex-col items-center justify-center rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/30 p-6 text-center transition-colors hover:border-indigo-400 dark:border-indigo-800 dark:bg-indigo-950/10">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100 dark:bg-zinc-900 dark:ring-indigo-900"><UploadIcon className="h-6 w-6" /></span>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Drag &amp; Drop files here</p>
              <p className="my-2 text-xs text-zinc-400">or</p>
              <Button onClick={() => fileInputRef.current?.click()}>Choose Files</Button>
              <input ref={fileInputRef} type="file" multiple accept={UPLOAD_ACCEPT_ATTR} className="hidden" onChange={(event) => { onFilesPicked(event.target.files); event.target.value = ""; }} />
              <p className="mt-4 max-w-xl text-xs leading-5 text-zinc-500">{UPLOAD_ACCEPT_LABEL} · Max {MAX_UPLOAD_SIZE_LABEL} per file · Up to {MAX_QUEUE_FILES} files</p>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
              <div><h2 className="text-sm font-semibold text-zinc-950 dark:text-white">Upload Queue ({queue.summary.total} files)</h2><p className="mt-0.5 text-xs text-zinc-500">Two files upload at a time.</p></div>
              {queue.aggregateAction && <Button variant="secondary" onClick={runAggregateAction}>{AGGREGATE_LABEL[queue.aggregateAction]}</Button>}
            </div>

            {queue.items.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center"><UploadIcon className="h-7 w-7 text-zinc-300" /><p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">Your upload queue is empty</p><p className="mt-1 text-xs text-zinc-500">Choose or drop files above to stage them.</p></div>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {queue.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 p-4 sm:gap-4">
                    <div className="flex h-14 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-[10px] font-semibold uppercase text-zinc-500 dark:bg-zinc-800">{item.file.name.split(".").pop() ?? "file"}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.file.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500">{item.file.type || "Unknown type"} · {formatBytes(item.file.size)}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="progressbar" aria-label={`${item.file.name} upload progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.pct}>
                        <div className={`h-full rounded-full transition-[width] ${item.state === "failed" ? "bg-red-500" : item.state === "completed" ? "bg-emerald-500" : "bg-indigo-600"}`} style={{ width: `${item.pct}%` }} />
                      </div>
                      {item.error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{item.error}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs">
                      <span className={`min-w-16 text-right font-medium ${STATE_TONE[item.state]}`}>{STATE_LABEL[item.state]}{item.state === "uploading" && ` ${item.pct}%`}</span>
                      {item.state === "staged" && <button className="text-zinc-500 hover:text-red-600" onClick={() => queue.removeItem(item.id)}>Remove</button>}
                      {(item.state === "waiting" || item.state === "uploading") && <button className="text-zinc-500 hover:text-red-600" onClick={() => { if (window.confirm(`Cancel uploading ${item.file.name}? The uploaded data will be deleted.`)) queue.cancelItem(item.id); }}>Cancel</button>}
                      {(item.state === "failed" || item.state === "canceled") && <><button className="font-medium text-indigo-600" onClick={() => queue.retryItem(item.id)}>Retry</button><button className="text-zinc-500" onClick={() => { if (window.confirm(`Dismiss ${item.file.name}? Any uploaded data will be deleted.`)) queue.removeItem(item.id); }}>Dismiss</button></>}
                      {item.state === "completed" && <button className="text-zinc-500" onClick={() => queue.removeItem(item.id)}>Dismiss</button>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800"><UploadIcon className="h-4 w-4 shrink-0 text-indigo-600" /><h2 className="text-sm font-semibold text-zinc-950 dark:text-white">Upload Summary</h2></div>
            <dl className="grid grid-cols-2 divide-x divide-y divide-zinc-200 dark:divide-zinc-800 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
              {[["Files in queue", queue.summary.total], ["Total size", formatBytes(queue.summary.totalBytes)], ["Completed", queue.summary.completed], ["Uploading", queue.summary.uploading], ["Waiting", queue.summary.staged + queue.summary.waiting], ["Failed", queue.summary.failed]].map(([label, value]) => <div key={label} className="p-4 text-center"><dd className="text-lg font-semibold text-zinc-900 dark:text-white">{value}</dd><dt className="mt-1 text-[11px] text-zinc-500">{label}</dt></div>)}
            </dl>
          </Card>
        </main>

        <aside className="space-y-5">
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-white">Upload to</h2>
            <label className="mt-4 block text-xs font-medium text-zinc-600 dark:text-zinc-300" htmlFor="upload-folder">Select folder</label>
            <select id="upload-folder" value={queue.folderId ?? ""} disabled={settingsLocked} onChange={(event) => queue.setFolderId(event.target.value || null)} className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:disabled:bg-zinc-800/60"><option value="" disabled>Select a Folder</option>{queue.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
            <label className="mt-4 block text-xs font-medium text-zinc-600 dark:text-zinc-300" htmlFor="upload-tag">Tags (optional)</label>
            <div className="mt-1.5 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
              <div className="flex flex-wrap gap-2">
                {queue.selectedTagIds.map((id) => {
                  const tag = queue.tags.find((candidate) => candidate.id === id);
                  if (!tag) return null;
                  return <span key={id} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{tag.name}<button type="button" disabled={settingsLocked} onClick={() => queue.setSelectedTagIds(queue.selectedTagIds.filter((tagId) => tagId !== id))} aria-label={`Remove ${tag.name}`} className="disabled:cursor-not-allowed disabled:opacity-50">×</button></span>;
                })}
              </div>
              <select id="upload-tag" value="" disabled={settingsLocked || queue.tags.length === queue.selectedTagIds.length} onChange={(event) => addTag(event.target.value)} className="mt-2 w-full bg-transparent px-1 py-1 text-sm text-zinc-600 outline-none disabled:cursor-not-allowed disabled:text-zinc-400 dark:text-zinc-300">
                <option value="">{queue.tags.length ? "Add a Tag" : "No tags available"}</option>
                {queue.tags.filter((tag) => !queue.selectedTagIds.includes(tag.id)).map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
              </select>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2"><LightbulbIcon className="h-4 w-4 shrink-0 text-indigo-600" /><h2 className="text-sm font-semibold text-zinc-950 dark:text-white">Upload Tips</h2></div>
            <ul className="mt-4 space-y-3 text-xs text-zinc-600 dark:text-zinc-300">{[`Use only ${UPLOAD_ACCEPT_LABEL}`, `Keep each file at or below ${MAX_UPLOAD_SIZE_LABEL}`, `Add up to ${MAX_QUEUE_FILES} files; two upload at a time`].map((tip) => <li key={tip} className="flex gap-2"><CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" /><span>{tip}</span></li>)}</ul>
          </Card>

          <RecentUploadsCard completedCount={queue.summary.completed} />
        </aside>
      </div>
    </div>
  );
}
