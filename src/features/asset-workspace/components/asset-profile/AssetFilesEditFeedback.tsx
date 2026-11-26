import { Button } from "@/components/ui/lovable/button";
import type { AssetFilesSnapshot, useAssetFilesEdit } from "../../hooks/use-asset-files-edit";
import { AssetThumbnail } from "../AssetThumbnail";

export function AssetFilesEditFeedback({ flow, photos, onObserved }: {
  flow: ReturnType<typeof useAssetFilesEdit>; photos: boolean; onObserved: (snapshot: AssetFilesSnapshot) => void;
}) {
  async function reload(discard: boolean) {
    const snapshot = await flow.reload(discard);
    if (snapshot) onObserved(snapshot);
  }
  const latest = flow.latest ? photos ? flow.latest.files.photos : flow.latest.files.documents : null;
  return (
    <>
      {(flow.failure || flow.selectionError || flow.plan.errors.length > 0 || flow.readError) && (
        <div role="alert" className="space-y-2 rounded-control border border-error/30 bg-error-muted p-3 text-xs">
          {flow.failure && <p>{flow.failure.message}</p>}
          {flow.selectionError && <p>{flow.selectionError}</p>}
          {flow.plan.errors.map((error) => <p key={error}>{error}</p>)}
          {flow.readError && <p>{flow.readError}</p>}
          {flow.failure?.code === "STALE" && (
            <Button variant="outline" size="sm" disabled={flow.reading} onClick={() => void reload(true)}>Reload and replace pending changes</Button>
          )}
          {flow.phase === "uncertain" && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={flow.reading} onClick={() => void reload(false)}>Check latest files</Button>
              <Button variant="outline" size="sm" disabled={flow.reading} onClick={() => void reload(true)}>Use latest files and start again</Button>
            </div>
          )}
        </div>
      )}
      {flow.reading && <p role="status" className="text-xs text-muted-foreground">Reading the latest asset and files…</p>}
      {latest && (
        <section aria-label="Latest server files" className="space-y-2 rounded-control border border-border p-3 text-xs">
          <h3 className="font-semibold">Latest server files ({latest.length})</h3>
          <p className="text-muted-foreground">Compare these saved files with your pending changes. No save has been repeated.</p>
          {latest.length ? (
            <ul className="space-y-2">
              {latest.map((file) => (
                <li key={file.fileId} className="flex min-w-0 items-center gap-2">
                  {file.mimeType.startsWith("image/") && <AssetThumbnail src={file.url} alt="" className="size-12 object-contain!" />}
                  {file.url ? (
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="rounded-control text-accent-foreground underline underline-offset-4 wrap-anywhere focus-visible:outline-2 focus-visible:outline-ring">{file.filename}</a>
                  ) : <span className="wrap-anywhere">{file.filename} · Link unavailable</span>}
                </li>
              ))}
            </ul>
          ) : <p>No files of this type are currently saved.</p>}
        </section>
      )}
    </>
  );
}
