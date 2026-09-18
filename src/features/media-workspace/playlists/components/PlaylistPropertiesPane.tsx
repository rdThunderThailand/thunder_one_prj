"use client";

import { Card } from "@/components/ui/Card";
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
    <Card className="flex h-full min-h-0 flex-col overflow-y-auto p-5">
      <div className="mb-4 flex gap-1 border-b border-border">
        {(["item", "playlist"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onTab(key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors ${
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
          <p className="py-10 text-center text-sm text-muted-foreground">เลือก item จากรายการเพื่อแก้ไข</p>
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
                <p className="truncate text-sm font-medium text-foreground">
                  {selectedItem.title ?? asset?.title ?? selectedItem.mediaAssetId}
                </p>
                <p className="text-xs text-muted-foreground">{isVideo ? "Video" : "Image"}</p>
              </div>
            </div>

            <Field label="Duration (seconds)">
              {isVideo ? (
                <p className="text-sm text-muted-foreground">ตามความยาวคลิป</p>
              ) : (
                <input
                  type="number"
                  min={1}
                  value={selectedItem.durationSeconds ?? ""}
                  onChange={(e) => onItemPatch({ durationSeconds: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring"
                />
              )}
            </Field>

            <Field label="Transition">
              <Select
                value={selectedItem.transition}
                options={TRANSITIONS.map((t) => ({ value: t, label: t }))}
                onChange={(e) => onItemPatch({ transition: e.target.value as Transition })}
              />
            </Field>

            <Field label="Transition duration (seconds)" optional hint="Empty = inherit playlist default.">
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
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </Field>

            <div className="rounded-lg border border-border p-3">
              <h3 className="mb-3 text-sm font-semibold text-foreground">
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
                      className="h-10 w-14 rounded-lg border border-border bg-card px-1"
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
              className="mt-2 rounded-lg border border-danger/30 py-2 text-sm font-medium text-danger hover:bg-danger-soft"
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
    </Card>
  );
}
