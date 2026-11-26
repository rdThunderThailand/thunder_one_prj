"use client";

import { useRef, type FormEvent } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/lovable/dialog";
import { Button } from "@/components/ui/lovable/button";
import { Textarea } from "@/components/ui/lovable/textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { ASSET_FILE_LIMIT, type AssetFileKind } from "../../domain/asset-files-edit";
import { useAssetFilesEdit, type AssetFilesSnapshot } from "../../hooks/use-asset-files-edit";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { getProfileFileRules } from "../../services/asset-profile-file-rules";
import type { ChangedAssetFiles } from "../../services/asset-files-change";
import type { AssetDetail, AssetFiles } from "../../services/asset-profile-contract";
import { RegistrationField } from "../register-asset/RegistrationFields";
import { AssetFilesEditItems } from "./AssetFilesEditItems";
import { AssetFilesEditFeedback } from "./AssetFilesEditFeedback";

export function AssetFilesEditDialog({ context, snapshot, kind, removeId, liveFiles, onFailed, onObserved, onSaved, onClose, restoreFocus }: {
  context: string; snapshot: AssetFilesSnapshot; kind: AssetFileKind; removeId?: string; liveFiles: AssetFiles;
  onFailed: () => void; onObserved: (snapshot: AssetFilesSnapshot) => void;
  onSaved: (files: ChangedAssetFiles, baseline: AssetDetail) => void; onClose: (refresh: boolean) => void; restoreFocus: () => void;
}) {
  const photos = kind === "photo";
  const rules = useProfileRead(`${context}:${snapshot.asset.id}:file-rules`, (signal) => getProfileFileRules(context, signal));
  const options = rules.result?.ok ? rules.result.data : null;
  const policy = { enabled: Boolean(options?.uploadStorage?.uploadEnabled && (photos ? options.photoUpload?.enabled : options.documentUpload?.enabled)),
    maxBytes: (photos ? options?.photoUpload?.maxBytesPerPhoto : options?.documentUpload?.maxBytesPerDocument) ?? 0 };
  const flow = useAssetFilesEdit(context, snapshot, kind, policy, removeId);
  const input = useRef<HTMLInputElement>(null);
  const replacing = useRef<string | undefined>(undefined);
  const isRemoval = Boolean(removeId);

  function choose(id?: string) {
    if (flow.locked || !policy.enabled || !input.current) return;
    replacing.current = id;
    input.current.multiple = !id;
    input.current.click();
  }
  function requestClose() {
    if (flow.isBusy()) return;
    const warning = flow.phase === "uncertain" ? "The save may have completed. Close and refresh the latest files before making another change?"
      : "Discard these pending file changes?";
    if (flow.plan.dirty && !window.confirm(warning)) return;
    onClose(flow.phase === "uncertain" || flow.failure?.code === "STALE");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await flow.save();
    if (saved) { toast.success(photos ? "Photos updated" : "Documents updated"); onSaved(saved, flow.baseline.asset); }
  }
  return (
    <Dialog open onOpenChange={(open) => { if (!open) requestClose(); }}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden rounded-card bg-card p-0 sm:max-w-2xl [&>button]:size-8 motion-reduce:animate-none"
        onEscapeKeyDown={(event) => { if (flow.isBusy()) event.preventDefault(); }}
        onPointerDownOutside={(event) => { if (flow.isBusy()) event.preventDefault(); }}
        onCloseAutoFocus={(event) => { event.preventDefault(); requestAnimationFrame(restoreFocus); }}>
        <DialogHeader className="shrink-0 border-b border-border p-4 pr-12 text-left">
          <DialogTitle>{photos ? "Edit photos" : isRemoval ? "Remove document" : "Add documents"}</DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {flow.items.length}/{ASSET_FILE_LIMIT[kind]} {photos ? "photos" : "documents"} after saving. Changes stay local until Save.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-col" aria-busy={flow.busy}>
          <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-4">
            <AssetFilesEditFeedback flow={flow} photos={photos} onObserved={onObserved} />
            {!rules.result ? (
              <div role="status" aria-label="Loading upload rules" className="motion-reduce:[&_*]:animate-none">
                <div aria-hidden="true">
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ) : !rules.result.ok ? (
              <div className="space-y-2 text-xs">
                <p role="alert">{rules.result.message}</p>
                <Button variant="outline" size="sm" onClick={rules.reload} disabled={rules.pending || flow.busy}>Reload upload rules</Button>
              </div>
            ) : !policy.enabled && !isRemoval ? <p className="text-xs text-muted-foreground">Uploads are temporarily unavailable. Existing files can still be removed.</p> : null}
            <input ref={input} type="file" className="sr-only" tabIndex={-1} aria-label={photos ? "Choose asset photos" : "Choose asset documents"}
              accept={photos ? ".jpg,.jpeg,.png,image/jpeg,image/png" : ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"}
              onChange={(event) => { flow.select(Array.from(event.target.files ?? []), replacing.current); event.target.value = ""; replacing.current = undefined; }} />
            <AssetFilesEditItems flow={flow} photos={photos} removingDocument={isRemoval} liveFiles={liveFiles} canUpload={policy.enabled} onChoose={choose} onFailed={onFailed} />
            {flow.baseline.asset.lifecycleStatus === "Disposed" && <p role="alert" className="text-xs text-error">Disposed assets can’t have their files changed.</p>}
            {!isRemoval && <p className="text-xs leading-relaxed text-muted-foreground">{photos ? "JPEG or PNG. Main is the oldest retained photo; new photos follow saved ones." : "PDF, JPEG or PNG. Warranty documents are read-only."}{policy.maxBytes > 0 ? ` Up to ${policy.maxBytes / 1048576} MiB per file.` : ""}</p>}
            {flow.plan.remove.length > 0 && (
              <RegistrationField name="asset-files-reason" label="Reason for removal or replacement" required error={flow.plan.reasonError}>
                <Textarea id="registration-asset-files-reason" rows={3} value={flow.reason} maxLength={1000} disabled={flow.locked}
                  aria-required="true" aria-invalid={Boolean(flow.plan.reasonError)} aria-describedby={flow.plan.reasonError ? "registration-asset-files-reason-error" : undefined}
                  onChange={(event) => flow.patchReason(event.target.value)} />
              </RegistrationField>
            )}
            {flow.busy && <p role="status" className="text-xs text-muted-foreground">{flow.phase === "uploading" ? "Uploading and verifying selected files…" : "Saving file changes…"} Keep this dialog open until the result is confirmed.</p>}
          </div>
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4">
            <Button variant="outline" size="sm" disabled={flow.busy || flow.reading} onClick={requestClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={!flow.canSave}>{flow.busy ? "Saving…" : isRemoval ? "Remove document" : "Save Changes"}</Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
