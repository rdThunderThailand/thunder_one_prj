"use client";

// Zone Properties (ticket 27, ADR 0063 §6; media fit/mute added by ADR 0064): geometry,
// bound content (ZoneContentList) and playback controls. Adding new content still happens
// in the `Insert to Layout` column beside the canvas; this panel is for what's already bound.

import { useState } from "react";
import { TrashIcon as Trash2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { ZoneGeometryFields } from "@/features/media-workspace/layouts/components/ZoneGeometryFields";
import type { LayoutZone } from "@/features/media-workspace/layouts/types";
import type { MediaAsset, PlaylistItem, PlaylistListItem } from "@/types/domain";
import { defaultBinding, type ZoneBindingDraft, type ZonePlayback } from "../zone-bindings";
import { ZoneContentList } from "./ZoneContentList";

const tabClasses = (active: boolean) =>
  `flex-1 rounded-lg px-3 py-1.5 text-[9px] font-medium ${active ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`;

const selectClasses =
  "mt-1 h-9 w-full rounded-lg border border-border bg-card px-2 text-xs text-foreground";

export function ZonePropertiesPanel({
  zone,
  referenceResolution,
  onZoneChange,
  binding,
  onBindingChange,
  onApplyPlaybackToAllZones,
  assets,
  previews,
  playlists,
  playlistDurations,
  playlistItemsById,
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
  previews: Record<string, string | undefined>;
  playlists: PlaylistListItem[];
  playlistDurations: Record<string, number | undefined>;
  playlistItemsById: Record<string, PlaylistItem[] | undefined>;
}) {
  const [tab, setTab] = useState<"layout" | "content">("content");
  const hasContent = binding.source === "playlist" ? Boolean(binding.playlistId) : binding.assetItems.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Zone name</span>
        <input
          key={zone.id ?? zone.position}
          defaultValue={zone.name}
          aria-label="Zone name"
          onBlur={(event) => {
            const name = event.currentTarget.value.trim();
            if (!name) {
              event.currentTarget.value = zone.name;
              return;
            }
            if (name !== zone.name) onZoneChange({ ...zone, name });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className="h-9 w-full rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </label>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-muted p-1">
        <button type="button" className={tabClasses(tab === "content")} onClick={() => setTab("content")}>Content</button>
        <button type="button" className={tabClasses(tab === "layout")} onClick={() => setTab("layout")}>Geometry</button>
      </div>

      {tab === "layout" && (
        <ZoneGeometryFields zone={zone} referenceResolution={referenceResolution} onChange={onZoneChange} />
      )}

      {tab === "content" && (
        <div className="flex flex-col gap-4">
          <ZoneContentList
            binding={binding}
            assets={assets}
            previews={previews}
            playlists={playlists}
            playlistDurations={playlistDurations}
            playlistItemsById={playlistItemsById}
            onBindingChange={onBindingChange}
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-muted-foreground">
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
            <label className="text-xs text-muted-foreground">
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
            <label className="text-xs text-muted-foreground">
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
            <label className="text-xs text-muted-foreground">
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

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={binding.playback.muted}
              onChange={(e) => onBindingChange({ ...binding, playback: { ...binding.playback, muted: e.target.checked } })}
              className="h-4 w-4 rounded border-border text-primary focus:ring-ring/30"
            />
            Mute this Zone
          </label>

          <Button variant="outline" size="sm" onClick={() => onApplyPlaybackToAllZones(binding.playback)}>
            Apply content settings to all Zones
          </Button>

          {hasContent && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => onBindingChange({ ...defaultBinding(binding.layoutZoneId), playback: binding.playback })}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove content
            </Button>
          )}
        </div>
      )}

    </div>
  );
}
