"use client";

import { ChevronDownIcon, XIcon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/Badge";
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
  moveAssetItemTo?: (mediaAssetId: string, targetIndex: number) => void;
};

function toPositiveInt(raw: string): number {
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed < 1 ? DEFAULT_IMAGE_DURATION_SECONDS : parsed;
}

export function SelectedAssetList({
  assets,
  previews,
  selection,
  bare = false,
}: {
  assets: MediaAsset[];
  previews: Record<string, string | undefined>;
  selection?: SelectionOverride;
  bare?: boolean;
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
  const moveAssetItemTo = selection?.moveAssetItemTo;

  if (assetItems.length === 0) return null;

  return (
    <div className={bare ? "" : "rounded-2xl border border-border bg-card p-4 shadow-sm"}>
      <p className="mb-2 text-sm font-semibold text-foreground">{`${assetItems.length} Asset${assetItems.length > 1 ? "s" : ""} Selected`}</p>
      <div className="flex flex-col gap-2">
        {assetItems.map((item, index) => {
          const asset = assets.find((a) => a.id === item.media_asset_id);
          if (!asset) return null;

          const isImage = isImageAsset(asset);
          const filename = asset.file?.original_filename ?? asset.title ?? asset.id;
          const dimensions = asset.width && asset.height ? `${asset.width} x ${asset.height}` : "—";
          const kindLabel = isImage ? "Image" : "Video";

          return (
            <div
              key={item.media_asset_id}
              draggable={!!moveAssetItemTo}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", item.media_asset_id);
                event.currentTarget.classList.add("opacity-50");
              }}
              onDragEnd={(event) => event.currentTarget.classList.remove("opacity-50")}
              onDragOver={(event) => {
                if (!moveAssetItemTo) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={(event) => {
                if (!moveAssetItemTo) return;
                event.preventDefault();
                moveAssetItemTo(event.dataTransfer.getData("text/plain"), index);
              }}
              title={moveAssetItemTo ? "Drag to reorder" : undefined}
              className={`grid grid-cols-[48px_minmax(0,1fr)_auto] items-start gap-2 rounded-lg border border-border p-2 transition ${moveAssetItemTo ? "cursor-grab active:cursor-grabbing" : ""}`}
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                <MediaThumb
                  url={previews[asset.id]}
                  kind={asset.kind}
                  mimeType={asset.file?.mime_type}
                  alt={filename}
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{filename}</p>
                <span className="mt-1 flex flex-wrap items-center gap-1.5"><Badge color={isImage ? "green" : "blue"} variant="pill">{kindLabel}</Badge><span className="text-xs text-muted-foreground">{dimensions}</span></span>
              </div>

              <button type="button" onClick={() => toggleAssetItem({ id: asset.id, isImage })} aria-label="Remove selected asset" className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><XIcon className="h-4 w-4" /></button>

              <div className="col-span-2 col-start-2 flex min-w-0 flex-wrap items-center gap-2">

              {isImage && (
                <div className="flex shrink-0 items-center gap-1.5">
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
                    className="w-16 rounded-lg border border-border px-2 py-1 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                  <span className="text-xs text-muted-foreground">วิ</span>
                </div>
              )}

              {setAssetTransition && (
                <select
                  value={item.transition ?? "cut"}
                  onChange={(event) => setAssetTransition(item.media_asset_id, event.target.value as "cut" | "fade")}
                  aria-label={`Transition for ${filename}`}
                  className="shrink-0 rounded-lg border border-border bg-card px-2 py-1 text-xs text-muted-foreground outline-none focus:border-ring"
                >
                  <option value="cut">Cut</option>
                  <option value="fade">Fade</option>
                </select>
              )}

              {assetItems.length > 1 && (
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveAssetItem(item.media_asset_id, -1)}
                    disabled={index === 0}
                    aria-label="Move up"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
                  >
                    <ChevronDownIcon className="h-4 w-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveAssetItem(item.media_asset_id, 1)}
                    disabled={index === assetItems.length - 1}
                    aria-label="Move down"
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:text-muted-foreground"
                  >
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                </div>
              )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
