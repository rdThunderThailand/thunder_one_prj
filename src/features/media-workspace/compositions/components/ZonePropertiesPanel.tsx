"use client";

// Zone Properties (ticket 27, ADR 0063 §6; media fit/mute added by ADR 0064): geometry and
// playback controls. Content lives in the `Insert to Layout` column beside the canvas,
// matching the editor's visual hierarchy.
//
// No editable Duration — it is always the sum of the bound Playlist's items, never a
// Zone-level number.

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TrashIcon } from "@/components/ui/icons";
import { parseResolution, referencePixels, roundPercent } from "@/features/media-workspace/layouts/geometry";
import type { LayoutZone } from "@/features/media-workspace/layouts/types";
import type { MediaAsset } from "@/types/domain";
import { totalZoneDurationSeconds, type ZoneBindingDraft, type ZonePlayback } from "../zone-bindings";

const tabClasses = (active: boolean) =>
  `flex-1 rounded-lg px-3 py-1.5 text-sm font-medium ${active ? "bg-white text-indigo-700 shadow-sm dark:bg-zinc-900 dark:text-indigo-300" : "text-zinc-500"}`;

const selectClasses =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

const geometryFields = ["x", "y", "width", "height"] as const;

export function ZonePropertiesPanel({
  zone,
  referenceResolution,
  onZoneChange,
  binding,
  onBindingChange,
  onApplyPlaybackToAllZones,
  assets,
  playlistDurations,
  canDelete,
  onDelete,
}: {
  zone: LayoutZone;
  referenceResolution: string | null;
  /** Caller gates this with ADR 0052 §3's shared-Template confirm before it lands, same as
   *  a canvas drag — geometry and naming both live on the shared `layout_zones` row. */
  onZoneChange: (next: LayoutZone) => void;
  binding: ZoneBindingDraft;
  onBindingChange: (next: ZoneBindingDraft) => void;
  onApplyPlaybackToAllZones: (playback: ZonePlayback) => void;
  assets: MediaAsset[];
  playlistDurations: Record<string, number | undefined>;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<"layout" | "content">("layout");
  const resolution = referenceResolution ? parseResolution(referenceResolution) : null;
  const assetDurations = Object.fromEntries(assets.map((a) => [a.id, a.duration_seconds ?? undefined]));
  const durationSeconds = totalZoneDurationSeconds(binding, assetDurations, playlistDurations);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Zone: {zone.name}</p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800">
        <button type="button" className={tabClasses(tab === "layout")} onClick={() => setTab("layout")}>Geometry</button>
        <button type="button" className={tabClasses(tab === "content")} onClick={() => setTab("content")}>Content</button>
      </div>

      {tab === "layout" && (
        <div className="grid grid-cols-2 gap-3">
          {geometryFields.map((key) => (
            <label key={key} className="flex flex-col gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {key.toUpperCase()} (%)
              <input
                type="number"
                step={0.001}
                min={key === "width" || key === "height" ? 0.1 : 0}
                max={100}
                value={zone[key]}
                onChange={(event) => {
                  const raw = Number.parseFloat(event.target.value);
                  if (Number.isNaN(raw)) return;
                  onZoneChange({ ...zone, [key]: roundPercent(raw) });
                }}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              {resolution && (
                <span className="text-[11px] text-zinc-400">
                  ≈ {referencePixels(zone[key], key === "x" || key === "width" ? resolution[0] : resolution[1])}px
                </span>
              )}
            </label>
          ))}
        </div>
      )}

      {tab === "content" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-zinc-500">
              Play mode
              <select
                value={binding.playback.playMode}
                onChange={(e) => onBindingChange({ ...binding, playback: { ...binding.playback, playMode: e.target.value as ZonePlayback["playMode"] } })}
                className={selectClasses}
              >
                <option value="sequential">Sequential</option>
                <option value="shuffle">Shuffle</option>
              </select>
            </label>
            <label className="text-xs text-zinc-500">
              Repeat
              <select
                value={binding.playback.repeat}
                onChange={(e) => onBindingChange({ ...binding, playback: { ...binding.playback, repeat: e.target.value as ZonePlayback["repeat"] } })}
                className={selectClasses}
              >
                <option value="loop">Loop</option>
                <option value="once">Once</option>
              </select>
            </label>
            <label className="text-xs text-zinc-500">
              Start from
              <select
                value={binding.playback.startFrom}
                onChange={(e) => onBindingChange({ ...binding, playback: { ...binding.playback, startFrom: e.target.value as ZonePlayback["startFrom"] } })}
                className={selectClasses}
              >
                <option value="first">First item</option>
                <option value="resume">Resume</option>
              </select>
            </label>
            <label className="text-xs text-zinc-500">
              Media fit
              <select
                value={binding.playback.mediaFit}
                onChange={(e) => onBindingChange({ ...binding, playback: { ...binding.playback, mediaFit: e.target.value as ZonePlayback["mediaFit"] } })}
                className={selectClasses}
              >
                <option value="fit">Fit (contain)</option>
                <option value="fill">Fill (crop)</option>
                <option value="stretch">Stretch</option>
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={binding.playback.muted}
              onChange={(e) => onBindingChange({ ...binding, playback: { ...binding.playback, muted: e.target.checked } })}
              className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-600"
            />
            Mute this Zone
          </label>

          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Duration</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-100">{durationSeconds}s</span>
          </div>

          <Button variant="secondary" onClick={() => onApplyPlaybackToAllZones(binding.playback)}>
            Apply content settings to all Zones
          </Button>
        </div>
      )}

      <div className="mt-auto border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <Button variant="secondary" disabled={!canDelete} onClick={onDelete} title={canDelete ? "Delete this Zone" : "A Layout must have at least one Zone"} className="w-full justify-center text-red-600 dark:text-red-400">
          <TrashIcon /> Delete Zone
        </Button>
      </div>
    </div>
  );
}
