import { Button } from "@/components/ui/lovable/button";
import { EditIcon, FileTextIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { ASSET_FILE_LIMIT } from "../../domain/asset-files-edit";
import type { useAssetFilesEdit } from "../../hooks/use-asset-files-edit";
import type { AssetFiles } from "../../services/asset-profile-contract";
import { fileSize } from "../../domain/asset-profile";
import { AssetThumbnail } from "../AssetThumbnail";

type Flow = ReturnType<typeof useAssetFilesEdit>;

function UploadProgress({ flow, id }: { flow: Flow; id: string }) {
  const progress = flow.progress[id];
  if (!progress) return <p className="text-xs text-muted-foreground">Local selection · uploads on Save</p>;
  return (
    <div className="space-y-1">
      <p role="status" className="text-xs text-muted-foreground">{progress.stage}</p>
      <progress value={progress.percent} max={100} aria-label="File upload progress" className="h-1.5 w-full overflow-hidden rounded-full bg-muted accent-primary [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary" />
    </div>
  );
}

export function AssetFilesEditItems({ flow, photos, removingDocument, liveFiles, canUpload, onChoose, onFailed }: {
  flow: Flow; photos: boolean; removingDocument: boolean; liveFiles: AssetFiles; canUpload: boolean;
  onChoose: (replaceId?: string) => void; onFailed: () => void;
}) {
  const limit = ASSET_FILE_LIMIT[photos ? "photo" : "document"];
  const removed = flow.original.filter((file) => flow.plan.remove.includes(file.fileId));
  return (
    <div className="space-y-3">
      {!removingDocument && (
        <ul aria-label={photos ? "Pending photo selections" : "Asset documents"} className={photos ? "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2" : "space-y-2"}>
          {flow.items.map((item, index) => {
            const saved = (photos ? liveFiles.photos : liveFiles.documents).find((file) => file.fileId === item.id) ?? item.existing;
            const name = item.file?.name ?? item.existing?.filename ?? "File";
            return (
              <li key={item.id} className="min-w-0 space-y-2 rounded-control border border-border p-3">
                {photos ? (
                  <div className="relative">
                    <AssetThumbnail src={item.previewUrl ?? saved?.url ?? null} alt={name} className="h-32 w-full object-contain! p-1" onFailed={item.existing ? onFailed : undefined} />
                    {index === 0 && item.existing && <span className="absolute top-1 left-1 rounded-pill border border-border bg-card px-2 py-0.5 text-xs font-medium">Main</span>}
                  </div>
                ) : <FileTextIcon aria-hidden="true" className="size-5 text-muted-foreground" />}
                <p className="text-xs font-medium wrap-anywhere">{name}</p>
                <p className="text-xs tabular-nums text-muted-foreground">{fileSize(item.file?.size ?? item.existing?.sizeBytes ?? 0)}</p>
                {item.file ? <UploadProgress flow={flow} id={item.id} /> : <p className="text-xs text-muted-foreground">Saved file</p>}
                {(photos || item.file) && (
                  <div className="flex flex-wrap gap-2">
                    {photos && (
                      <Button variant="outline" size="sm" disabled={flow.locked || !canUpload} onClick={() => onChoose(item.id)} aria-label={`Replace ${name}`}>
                        <EditIcon aria-hidden="true" className="size-3.5" />
                        Replace
                      </Button>
                    )}
                    <Button variant="outline" size="sm" disabled={flow.locked} onClick={() => flow.remove(item.id)} aria-label={`Remove ${name}`}>
                      <TrashIcon aria-hidden="true" className="size-3.5" />
                      Remove
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!removingDocument && (
        <Button variant="outline" className="min-h-10 w-full border-dashed border-primary/30 text-accent-foreground hover:bg-accent"
          disabled={flow.locked || !canUpload || flow.items.length >= limit} onClick={() => onChoose()}>
          <PlusIcon aria-hidden="true" className="size-4" />
          {photos ? "Add photos" : "Add documents"}
        </Button>
      )}
      {photos && !flow.items.length && <p className="text-xs text-muted-foreground">No photos selected. You can save an asset without photos.</p>}
      {removed.length > 0 && (
        <section aria-label="Files to remove" className="space-y-2 rounded-control border border-border bg-muted p-3">
          <p className="text-xs font-semibold">{removingDocument ? "Remove this document?" : "Will be removed on Save"}</p>
          <ul className="space-y-2 text-xs">
            {removed.map((file) => (
              <li key={file.fileId} className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 wrap-anywhere">{file.filename}</span>
                {!removingDocument && <Button variant="ghost" size="sm" disabled={flow.locked || flow.items.length >= limit} onClick={() => flow.restore(file.fileId)}>Undo remove</Button>}
              </li>
            ))}
          </ul>
          <p className="text-xs leading-relaxed text-muted-foreground">It stays in History. Removing a file hides it from the current files; it is not deleted.</p>
        </section>
      )}
    </div>
  );
}
