"use client";

import { Card } from "@/components/ui/Card";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { MediaAsset } from "@/types/domain";
import { MEDIA_FITS, TRANSITIONS, type DraftItem, type PlaylistInfo, type Transition } from "../types";
import { Field, Select, TextArea } from "./form";

type Tab = "item" | "playlist";

/** #33 right pane. The Item tab carries only what the schema supports today (duration,
 *  transition, remove) — fit / background / notes / transition-duration land with #37. */
export function PlaylistPropertiesPane({
  tab,
  onTab,
  selectedItem,
  asset,
  info,
  onItemPatch,
  onItemRemove,
  onInfoChange,
}: {
  tab: Tab;
  onTab: (tab: Tab) => void;
  selectedItem: DraftItem | null;
  asset: MediaAsset | undefined;
  info: PlaylistInfo;
  onItemPatch: (patch: Partial<DraftItem>) => void;
  onItemRemove: () => void;
  onInfoChange: (patch: Partial<PlaylistInfo>) => void;
}) {
  const previews = usePreviewUrls(selectedItem ? [selectedItem.mediaAssetId] : []);
  const isVideo = selectedItem ? (selectedItem.kind ?? asset?.kind) === "video" : false;

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-y-auto p-5">
      <div className="mb-4 flex gap-1 border-b border-zinc-100 dark:border-zinc-800">
        {(["item", "playlist"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onTab(key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors ${
              tab === key
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === "item" ? (
        !selectedItem ? (
          <p className="py-10 text-center text-sm text-zinc-400">เลือก item จากรายการเพื่อแก้ไข</p>
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
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {selectedItem.title ?? asset?.title ?? selectedItem.mediaAssetId}
                </p>
                <p className="text-xs text-zinc-400">{isVideo ? "Video" : "Image"}</p>
              </div>
            </div>

            <Field label="Duration (seconds)">
              {isVideo ? (
                <p className="text-sm text-zinc-400">ตามความยาวคลิป</p>
              ) : (
                <input
                  type="number"
                  min={1}
                  value={selectedItem.durationSeconds ?? ""}
                  onChange={(e) => onItemPatch({ durationSeconds: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
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

            <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Display Options
              </h3>
              <div className="flex flex-col gap-3">
                <Field label="Fit">
                  <Select
                    disabled
                    value=""
                    placeholder="Playlist default"
                    options={MEDIA_FITS.map((fit) => ({ value: fit, label: fit }))}
                    onChange={() => undefined}
                  />
                </Field>
                <Field label="Background">
                  <input
                    type="color"
                    disabled
                    value="#000000"
                    className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-2 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </Field>
                <Field label="Notes" optional hint="Available with item display fields (#37).">
                  <TextArea disabled rows={3} value="" placeholder="Notes..." />
                </Field>
              </div>
            </div>

            <button
              type="button"
              onClick={onItemRemove}
              className="mt-2 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
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
