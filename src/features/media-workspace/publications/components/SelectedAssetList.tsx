"use client";

import { ChevronDownIcon, XIcon } from "@/components/ui/icons";
import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { DEFAULT_IMAGE_DURATION_SECONDS, isImageAsset } from "../draft-mapping";
import type { DraftAssetItem, MediaAsset } from "../types";

/** Lets a caller outside the Publication wizard (the Composition Zone editor) reuse this
 *  list against its own state instead of the wizard's store — falls back to the store
 *  when omitted. */
type SelectionOverride = {
  assetItems: DraftAssetItem[];
  toggleAssetItem: (asset: { id: string; isImage: boolean }) => void;
  setAssetDuration: (mediaAssetId: string, seconds: number | null) => void;
  setAssetTransition?: (mediaAssetId: string, transition: "cut" | "fade") => void;
  moveAssetItem: (mediaAssetId: string, direction: -1 | 1) => void;
};

function toPositiveInt(raw: string): number {
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed < 1 ? DEFAULT_IMAGE_DURATION_SECONDS : parsed;
}

export function SelectedAssetList({
  assets,
  previews,
  selection,
}: {
  assets: MediaAsset[];
  previews: Record<string, string | undefined>;
  selection?: SelectionOverride;
}) {
  const storeAssetItems = usePublicationDraftStore((s) => s.assetItems);
  const storeToggleAssetItem = usePublicationDraftStore((s) => s.toggleAssetItem);
  const storeSetAssetDuration = usePublicationDraftStore((s) => s.setAssetDuration);
  const storeMoveAssetItem = usePublicationDraftStore((s) => s.moveAssetItem);
  const assetItems = selection?.assetItems ?? storeAssetItems;
  const toggleAssetItem = selection?.toggleAssetItem ?? storeToggleAssetItem;
  const setAssetDuration = selection?.setAssetDuration ?? storeSetAssetDuration;
  const moveAssetItem = selection?.moveAssetItem ?? storeMoveAssetItem;
  const setAssetTransition = selection?.setAssetTransition;

  if (assetItems.length === 0) return null;

  return (
    <Card className="p-4">
      <p className="mb-2 text-sm font-semibold text-zinc-900">{`${assetItems.length} Asset${assetItems.length > 1 ? "s" : ""} Selected`}</p>
      <div className="flex flex-col gap-2">
        {assetItems.map((item, index) => {
          const asset = assets.find((a) => a.id === item.media_asset_id);
          if (!asset) return null;

          const isImage = isImageAsset(asset);
          const filename = asset.file?.original_filename ?? asset.title ?? asset.id;
          const dimensions = asset.width && asset.height ? `${asset.width} x ${asset.height}` : "—";
          const kindLabel = isImage ? "Image" : "Video";

          return (
            <div key={item.media_asset_id} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-2">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                <MediaThumb
                  url={previews[asset.id]}
                  kind={asset.kind}
                  mimeType={asset.file?.mime_type}
                  alt={filename}
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">{filename}</p>
                <p className="text-xs text-zinc-400">
                  {kindLabel} · {dimensions}
                </p>
              </div>

              {isImage && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    // ponytail: uncontrolled + clamp on blur. Bound to the store it snapped an
                    // emptied field straight back to 10, so you could never backspace and retype.
                    defaultValue={item.duration_seconds ?? DEFAULT_IMAGE_DURATION_SECONDS}
                    onBlur={(e) => {
                      const secs = toPositiveInt(e.target.value);
                      e.target.value = String(secs);
                      setAssetDuration(item.media_asset_id, secs);
                    }}
                    aria-label={`Seconds on screen for ${filename}`}
                    className="w-16 rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <span className="text-xs text-zinc-400">วิ</span>
                </div>
              )}

              {setAssetTransition && (
                <select
                  value={item.transition ?? "cut"}
                  onChange={(event) => setAssetTransition(item.media_asset_id, event.target.value as "cut" | "fade")}
                  aria-label={`Transition for ${filename}`}
                  className="shrink-0 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 outline-none focus:border-indigo-500"
                >
                  <option value="cut">Cut</option>
                  <option value="fade">Fade</option>
                </select>
              )}

              {assetItems.length > 1 && (
                <div className="flex flex-col gap-0.5 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => moveAssetItem(item.media_asset_id, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:hover:text-zinc-400"
                  >
                    <ChevronDownIcon className="h-4 w-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveAssetItem(item.media_asset_id, 1)}
                    disabled={index === assetItems.length - 1}
                    aria-label="Move down"
                    className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:hover:text-zinc-400"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => toggleAssetItem({ id: asset.id, isImage })}
                aria-label="Remove selected asset"
                className="shrink-0 text-zinc-400 hover:text-zinc-700 ml-2"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
