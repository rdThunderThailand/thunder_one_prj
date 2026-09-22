"use client";

import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { MediaAsset } from "@/types/domain";
import {
  MEDIA_FITS,
  TRANSITIONS,
  type DraftItem,
  type PlaylistInfo,
  type PlaylistPlayback,
  type Transition,
} from "../types";
import { Field, Select, TextArea } from "./form";

type Tab = "item" | "playlist";

/** #33 right pane. */
export function PlaylistPropertiesPane({
  tab,
  onTab,
  selectedItem,
  asset,
  info,
  playback,
  onItemPatch,
  onItemRemove,
  onInfoChange,
}: {
  tab: Tab;
  onTab: (tab: Tab) => void;
  selectedItem: DraftItem | null;
  asset: MediaAsset | undefined;
  info: PlaylistInfo;
  playback: PlaylistPlayback;
  onItemPatch: (patch: Partial<DraftItem>) => void;
  onItemRemove: () => void;
  onInfoChange: (patch: Partial<PlaylistInfo>) => void;
}) {
  const previews = usePreviewUrls(selectedItem ? [selectedItem.mediaAssetId] : []);
  const isVideo = selectedItem ? (selectedItem.kind ?? asset?.kind) === "video" : false;

  return (
    <div className="flex min-h-[32rem] flex-col overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-panel xl:h-full xl:min-h-0" aria-label="Playlist properties">
      <div className="mb-4 flex gap-1 border-b border-border">
        {(["item", "playlist"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onTab(key)}
            className={`border-b-2 px-3 py-2 text-xs font-medium capitalize transition-colors ${
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === "item" ? (
        !selectedItem ? (
          <p className="py-10 text-center text-xs text-muted-foreground">เลือก item จากรายการเพื่อแก้ไข</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <MediaThumb
                url={previews.urls[selectedItem.mediaAssetId]}
                kind={selectedItem.kind ?? asset?.kind}
                alt={selectedItem.title ?? ""}
                className="h-12 w-16"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {selectedItem.title ?? asset?.title ?? selectedItem.mediaAssetId}
                </p>
                <p className="text-xs text-muted-foreground">{isVideo ? "Video" : "Image"}</p>
              </div>
            </div>

            <Field label="Duration">
              {isVideo ? (
                <p className="text-xs text-muted-foreground">ตามความยาวคลิป</p>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    value={selectedItem.durationSeconds ?? ""}
                    onChange={(e) => onItemPatch({ durationSeconds: Math.max(1, Number(e.target.value) || 1) })}
                    className="h-9 w-full rounded-lg border border-border pl-3 pr-10 text-xs outline-none focus:border-ring"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">sec</span>
                </div>
              )}
            </Field>

            <Field label="Transition">
              <Select
                value={selectedItem.transition}
                options={TRANSITIONS.map((t) => ({ value: t, label: t }))}
                onChange={(e) => onItemPatch({ transition: e.target.value as Transition })}
              />
            </Field>

            <Field label="Transition Duration" optional hint="Empty = inherit playlist default.">
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={selectedItem.transitionDurationSeconds ?? ""}
                  placeholder={String(
                    playback.transitionDuration ?? (selectedItem.transition === "fade" ? 1 : 0)
                  )}
                  onChange={(e) =>
                    onItemPatch({
                      transitionDurationSeconds: e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="h-9 w-full rounded-lg border border-border pl-3 pr-10 text-xs outline-none focus:border-ring"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">sec</span>
              </div>
            </Field>

            <div className="border-t border-border pt-3">
              <h3 className="mb-3 text-xs font-semibold text-foreground">
                Display Options
              </h3>
              <div className="flex flex-col gap-3">
                <Field label="Fit" optional hint="Empty = inherit playlist default.">
                  <Select
                    value={selectedItem.fit ?? ""}
                    placeholder={`Playlist default (${playback.mediaFit ?? "fit"})`}
                    options={MEDIA_FITS.map((fit) => ({ value: fit, label: fit }))}
                    onChange={(e) => onItemPatch({ fit: (e.target.value || undefined) as typeof selectedItem.fit })}
                  />
                </Field>
                <Field label="Background" optional hint="No override paints nothing.">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedItem.backgroundColor ?? "#000000"}
                      onChange={(e) => onItemPatch({ backgroundColor: e.target.value })}
                      className="h-9 w-12 rounded-lg border border-border bg-card px-1"
                    />
                    {selectedItem.backgroundColor && (
                      <button
                        type="button"
                        onClick={() => onItemPatch({ backgroundColor: undefined })}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </Field>
                <Field label="Notes" optional>
                  <TextArea
                    rows={3}
                    value={selectedItem.notes ?? ""}
                    placeholder="Notes..."
                    onChange={(e) => onItemPatch({ notes: e.target.value || undefined })}
                  />
                </Field>
              </div>
            </div>

            <button
              type="button"
              onClick={onItemRemove}
              className="mt-2 rounded-lg border border-danger/30 py-2 text-xs font-medium text-danger hover:bg-danger-soft"
            >
              Remove from Playlist
            </button>
          </div>
        )
      ) : (
        <Field label="Description" optional>
          <TextArea
            rows={5}
            value={info.description ?? ""}
            onChange={(e) => onInfoChange({ description: e.target.value })}
            placeholder="รายละเอียด playlist..."
          />
        </Field>
      )}
    </div>
  );
}
