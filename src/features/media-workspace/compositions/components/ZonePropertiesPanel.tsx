"use client";

// Zone Properties (ticket 27, ADR 0063 §6): three tabs showing only what the player
// actually reads. Content is the existing ZoneContentPicker; Layout and Behavior are new.
//
// No Fill Mode, no Mute, no editable Duration — the schema has nowhere for the first two
// (`media_fit` lives on Playlist metadata, `mute` exists nowhere) and Duration is always the
// sum of the bound Playlist's items, never a Zone-level number.

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { parseResolution, referencePixels, roundPercent } from "@/features/media-workspace/layouts/geometry";
import type { LayoutZone } from "@/features/media-workspace/layouts/types";
import type { PlaylistListItem } from "@/features/media-workspace/playlists";
import type { MediaAsset } from "@/types/domain";
import { totalZoneDurationSeconds, type ZoneBindingDraft, type ZonePlayback } from "../zone-bindings";
import { ZoneContentPicker } from "./ZoneContentPicker";

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
  playlists,
  previews,
  playlistPreviews,
  playlistDurations,
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
  playlists: PlaylistListItem[];
  previews: Record<string, string | undefined>;
  playlistPreviews: Record<string, { url?: string; thumbnailUrl?: string }>;
  playlistDurations: Record<string, number | undefined>;
}) {
  const [tab, setTab] = useState<"content" | "layout" | "behavior">("content");
  const resolution = referenceResolution ? parseResolution(referenceResolution) : null;
  const assetDurations = Object.fromEntries(assets.map((a) => [a.id, a.duration_seconds ?? undefined]));
  const durationSeconds = totalZoneDurationSeconds(binding, assetDurations, playlistDurations);

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Zone: {zone.name}</p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-800">
        <button type="button" className={tabClasses(tab === "content")} onClick={() => setTab("content")}>Content</button>
        <button type="button" className={tabClasses(tab === "layout")} onClick={() => setTab("layout")}>Layout</button>
        <button type="button" className={tabClasses(tab === "behavior")} onClick={() => setTab("behavior")}>Behavior</button>
      </div>

      {tab === "content" && (
        <ZoneContentPicker
          zoneName={zone.name}
          binding={binding}
          onChange={onBindingChange}
          assets={assets}
          playlists={playlists}
          previews={previews}
          playlistPreviews={playlistPreviews}
          playlistDurations={playlistDurations}
        />
      )}

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

      {tab === "behavior" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
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
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Duration</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-100">{durationSeconds}s</span>
          </div>

          <Button variant="secondary" onClick={() => onApplyPlaybackToAllZones(binding.playback)}>
            Apply playback settings to all Zones
          </Button>
        </div>
      )}
    </Card>
  );
}
