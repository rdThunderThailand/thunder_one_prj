"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UploadIcon } from "@/components/ui/icons";
import { useAssetUpload } from "@/features/media-workspace/assets/useAssetUpload";
import { UPLOAD_ACCEPT_ATTR, UPLOAD_ACCEPT_LABEL } from "@/features/media-workspace/publications/upload-limits";
import type { MediaAsset } from "@/types/domain";
import { AssetPicker } from "./AssetPicker";

/** The editor's asset browser: upload plus the pick-to-add grid. `onToggle` adds or removes
 *  the asset; `onUploaded` runs after a successful upload so the host can refetch and select. */
export function PlaylistContentLibrary({
  assets,
  loading,
  selectedIds,
  onToggle,
  onUploaded,
}: {
  assets: MediaAsset[];
  loading: boolean;
  selectedIds: string[];
  onToggle: (asset: MediaAsset) => void;
  onUploaded: (asset: MediaAsset | null) => void | Promise<void>;
}) {
  const { fileInputRef, uploadPct, uploadError, handleFilePicked } = useAssetUpload((asset) => onUploaded(asset));

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Content Library</h2>
        <input ref={fileInputRef} type="file" accept={UPLOAD_ACCEPT_ATTR} onChange={handleFilePicked} className="hidden" />
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadPct !== null}>
          <UploadIcon className="h-3.5 w-3.5" />
          {uploadPct !== null ? `Uploading ${uploadPct}%` : "Upload Asset"}
        </Button>
      </div>
      {uploadError ? (
        <p className="mb-3 text-xs text-red-500">{uploadError}</p>
      ) : (
        <p className="mb-3 text-xs text-zinc-400">{UPLOAD_ACCEPT_LABEL}</p>
      )}
      <AssetPicker assets={assets} loading={loading} selectedIds={selectedIds} onToggle={onToggle} />
    </Card>
  );
}
