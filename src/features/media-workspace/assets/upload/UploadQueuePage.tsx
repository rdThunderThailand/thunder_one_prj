"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/lovable/button";
import { Card } from "@/components/ui/Card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/lovable/alert-dialog";
import { CheckCircleIcon, LightbulbIcon, UploadIcon } from "@/components/ui/icons";
import { formatBytes } from "@/features/media-workspace/playlists/totals";
import { MAX_UPLOAD_SIZE_LABEL, UPLOAD_ACCEPT_ATTR, UPLOAD_ACCEPT_LABEL } from "@/features/media-workspace/publications/upload-limits";
import { type UploadItemState } from "./upload-queue";
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
  staged: "text-muted-foreground",
  waiting: "text-warning",
  uploading: "text-primary",
  completed: "text-success",
  failed: "text-danger",
  canceled: "text-muted-foreground",
};

const AGGREGATE_LABEL = {
  "clear-queue": "Clear Queue",
  "cancel-all": "Cancel All",
  "clear-all": "Clear All",
} as const;

function QueuedFilePreview({ file }: { file: File }) {
  const [url] = useState(() => URL.createObjectURL(file));

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  if (file.type.startsWith("image/")) return <Image src={url} alt="" fill unoptimized className="object-cover" />;
  if (file.type.startsWith("video/")) return <video src={url} muted playsInline preload="metadata" aria-hidden="true" className="h-full w-full object-cover" />;
  return null;
}

export function UploadQueuePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queue = useUploadQueue();
  const stagedItems = queue.items.filter((item) => item.state === "staged");
  const canStart = stagedItems.length > 0 && stagedItems.every((item) => item.title.trim());
  const settingsLocked = queue.items.some((item) => item.state === "waiting" || item.state === "uploading");
  const [confirmation, setConfirmation] = useState<
    | { action: "aggregate"; label: string }
    | { action: "cancel" | "dismiss"; id: string; label: string }
    | null
  >(null);

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
    if (action === "clear-queue") queue.runAggregateAction();
    else setConfirmation({ action: "aggregate", label: AGGREGATE_LABEL[action] });
  };

  const confirmAction = () => {
    if (!confirmation) return;
    if (confirmation.action === "aggregate") queue.runAggregateAction();
    if (confirmation.action === "cancel") queue.cancelItem(confirmation.id);
    if (confirmation.action === "dismiss") queue.removeItem(confirmation.id);
    setConfirmation(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Link href="/media-workspace/assets" className="hover:text-primary">Media Library</Link><span aria-hidden="true">/</span><span>Upload Media</span></div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Upload Media</h1>
          <p className="mt-1 text-sm text-muted-foreground">Upload and manage your media assets.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled title="Coming in Phase 2">Add from Source · Phase 2</Button>
          <Button disabled={!canStart} onClick={queue.startUpload}><UploadIcon /> Start Upload</Button>
        </div>
      </div>

      {queue.rejections.length > 0 && (
        <div className="space-y-1 rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger" role="alert">
          {queue.rejections.map((reason) => <p key={reason}>{reason}</p>)}
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0 space-y-5">
          <Card className="p-4">
            <div onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className="flex min-h-60 flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary-soft p-6 text-center transition-colors hover:border-primary/30">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-card text-primary shadow-sm ring-1 ring-primary/30"><UploadIcon className="h-6 w-6" /></span>
              <p className="text-sm font-semibold text-foreground">Drag &amp; Drop files here</p>
              <p className="my-2 text-xs text-muted-foreground">or</p>
              <Button onClick={() => fileInputRef.current?.click()}>Choose Files</Button>
              <input ref={fileInputRef} type="file" multiple accept={UPLOAD_ACCEPT_ATTR} className="hidden" onChange={(event) => { onFilesPicked(event.target.files); event.target.value = ""; }} />
              <p className="mt-4 max-w-xl text-xs leading-5 text-muted-foreground">{UPLOAD_ACCEPT_LABEL} · Max {MAX_UPLOAD_SIZE_LABEL} per file · No queue limit</p>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
              <div><h2 className="text-sm font-semibold text-foreground">Upload Queue ({queue.summary.total} files)</h2><p className="mt-0.5 text-xs text-muted-foreground">Two files upload at a time.</p></div>
              {queue.aggregateAction && <Button variant="outline" onClick={runAggregateAction}>{AGGREGATE_LABEL[queue.aggregateAction]}</Button>}
            </div>

            {queue.items.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center px-4 text-center"><UploadIcon className="h-7 w-7 text-muted-foreground" /><p className="mt-3 text-sm font-medium text-muted-foreground">Your upload queue is empty</p><p className="mt-1 text-xs text-muted-foreground">Choose or drop files above to stage them.</p></div>
            ) : (
              <ul className="divide-y divide-border">
                {queue.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 p-4 sm:gap-4">
                    <div className="relative flex h-14 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-[10px] font-semibold uppercase text-muted-foreground"><QueuedFilePreview file={item.file as File} /></div>
                    <div className="min-w-0 flex-1">
                      {item.state === "staged" ? <input aria-label={`Display name for ${item.file.name}`} value={item.title} maxLength={200} onChange={(event) => queue.renameItem(item.id, event.target.value)} className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-foreground outline-none hover:border-border focus:border-ring focus:ring-2 focus:ring-ring/30" /> : <p className="truncate text-sm font-medium text-foreground">{item.title}</p>}
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.file.type || "Unknown type"} · {formatBytes(item.file.size)}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${item.file.name} upload progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.pct}>
                        <div className={`h-full rounded-full transition-[width] ${item.state === "failed" ? "bg-danger" : item.state === "completed" ? "bg-success" : "bg-primary"}`} style={{ width: `${item.pct}%` }} />
                      </div>
                      {item.error && <p className="mt-1 text-xs text-danger">{item.error}</p>}
                      {item.warning && <p className="mt-1 text-xs text-warning">{item.warning}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs">
                      <span className={`min-w-16 text-right font-medium ${STATE_TONE[item.state]}`}>{STATE_LABEL[item.state]}{item.state === "uploading" && ` ${item.pct}%`}</span>
                      {item.state === "staged" && <button className="text-muted-foreground hover:text-danger" onClick={() => queue.removeItem(item.id)}>Remove</button>}
                      {(item.state === "waiting" || item.state === "uploading") && <button className="text-muted-foreground hover:text-danger" onClick={() => setConfirmation({ action: "cancel", id: item.id, label: item.file.name })}>Cancel</button>}
                      {(item.state === "failed" || item.state === "canceled") && <><button className="font-medium text-primary" onClick={() => queue.retryItem(item.id)}>Retry</button><button className="text-muted-foreground" onClick={() => setConfirmation({ action: "dismiss", id: item.id, label: item.file.name })}>Dismiss</button></>}
                      {item.state === "completed" && <button className="text-muted-foreground" onClick={() => queue.removeItem(item.id)}>Dismiss</button>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3"><UploadIcon className="h-4 w-4 shrink-0 text-primary" /><h2 className="text-sm font-semibold text-foreground">Upload Summary</h2></div>
            <dl className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
              {[["Files in queue", queue.summary.total], ["Total size", formatBytes(queue.summary.totalBytes)], ["Completed", queue.summary.completed], ["Uploading", queue.summary.uploading], ["Waiting", queue.summary.staged + queue.summary.waiting], ["Failed", queue.summary.failed]].map(([label, value]) => <div key={label} className="p-4 text-center"><dd className="text-lg font-semibold text-foreground">{value}</dd><dt className="mt-1 text-[11px] text-muted-foreground">{label}</dt></div>)}
            </dl>
          </Card>
        </main>

        <aside className="space-y-5">
          <Card className="p-4">
            <h2 className="text-sm font-semibold text-foreground">Upload to</h2>
            <label className="mt-4 block text-xs font-medium text-muted-foreground" htmlFor="upload-folder">Select folder</label>
            <select id="upload-folder" value={queue.folderId ?? ""} disabled={settingsLocked} onChange={(event) => queue.setFolderId(event.target.value || null)} className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"><option value="">Uncategorized</option>{queue.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
            <label className="mt-4 block text-xs font-medium text-muted-foreground" htmlFor="upload-tag">Tags (optional)</label>
            <div className="mt-1.5 rounded-lg border border-border bg-card p-2">
              <div className="flex flex-wrap gap-2">
                {queue.selectedTagIds.map((id) => {
                  const tag = queue.tags.find((candidate) => candidate.id === id);
                  if (!tag) return null;
                  return <span key={id} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">{tag.name}<button type="button" disabled={settingsLocked} onClick={() => queue.setSelectedTagIds(queue.selectedTagIds.filter((tagId) => tagId !== id))} aria-label={`Remove ${tag.name}`} className="disabled:cursor-not-allowed disabled:opacity-50">×</button></span>;
                })}
              </div>
              <select id="upload-tag" value="" disabled={settingsLocked || queue.tags.length === queue.selectedTagIds.length} onChange={(event) => addTag(event.target.value)} className="mt-2 w-full bg-transparent px-1 py-1 text-sm text-muted-foreground outline-none disabled:cursor-not-allowed disabled:text-muted-foreground">
                <option value="">{queue.tags.length ? "Add a Tag" : "No tags available"}</option>
                {queue.tags.filter((tag) => !queue.selectedTagIds.includes(tag.id)).map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
              </select>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2"><LightbulbIcon className="h-4 w-4 shrink-0 text-primary" /><h2 className="text-sm font-semibold text-foreground">Upload Tips</h2></div>
            <ul className="mt-4 space-y-3 text-xs text-muted-foreground">{[`Use only ${UPLOAD_ACCEPT_LABEL}`, `Keep each file at or below ${MAX_UPLOAD_SIZE_LABEL}`, "No queue limit; two files upload at a time"].map((tip) => <li key={tip} className="flex gap-2"><CheckCircleIcon className="h-4 w-4 shrink-0 text-success" /><span>{tip}</span></li>)}</ul>
          </Card>

          <RecentUploadsCard completedCount={queue.summary.completed} />
        </aside>
      </div>
      <AlertDialog open={confirmation !== null} onOpenChange={(open) => { if (!open) setConfirmation(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation?.action === "aggregate" ? confirmation.label : confirmation?.action === "cancel" ? "Cancel upload?" : "Dismiss upload?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.action === "aggregate"
                ? "Uploaded data for in-progress files will be deleted."
                : `${confirmation?.label ?? "This file"} and its uploaded data will be removed.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep</AlertDialogCancel>
            <AlertDialogAction className="bg-danger hover:bg-danger" onClick={confirmAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
