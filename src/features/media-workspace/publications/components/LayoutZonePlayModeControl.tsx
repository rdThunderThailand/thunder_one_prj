"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { isConflict } from "@/lib/api/api-error";
import { fetchComposition, setCompositionZones } from "@/features/media-workspace/compositions/services/compositions-api";
import { bindingsFromCompositionZones, toSetZonesPayload, withZonePlayModes } from "@/features/media-workspace/compositions/zone-bindings";
import { formatDuration } from "@/features/media-workspace/playlists";
import { fetchAffectedPrograms } from "@/features/media-workspace/publish-changes/publish-changes-api";
import { applyPlaybackPattern } from "../playback-pattern-apply";
import type { ZonePlayback } from "../content-info";
import { SharedWriteNote, useSharedWriteConfirm } from "./SharedWriteConfirm";

type PlayMode = ZonePlayback["playMode"];

/** How to Play for a Layout Program: every Zone's resolved playback, and a Sequential / Shuffle choice for
 *  the Zones that have content (ADR 0083 §6). One Apply writes the Layout's Zone bindings, so it re-counts
 *  the Programs using the Layout and asks first when there are any. */
export function LayoutZonePlayModeControl({
  compositionId,
  zones,
  onLayoutChanged,
}: {
  compositionId: string;
  zones: ZonePlayback[];
  onLayoutChanged?: () => void;
}) {
  const [changes, setChanges] = useState<Record<string, PlayMode>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useSharedWriteConfirm("Layout");
  const sawConflict = useRef(false);

  const modeOf = (zone: ZonePlayback): PlayMode => changes[zone.id] ?? zone.playMode;
  const choose = (zone: ZonePlayback, mode: PlayMode) =>
    setChanges((current) => {
      const next = { ...current };
      if (mode === zone.playMode) delete next[zone.id];
      else next[zone.id] = mode;
      return next;
    });
  const isChanged = Object.keys(changes).length > 0;

  const apply = async () => {
    if (!isChanged || saving) return;
    const id = compositionId;
    const picked = { ...changes };
    setSaving(true);
    setError(null);
    sawConflict.current = false;
    const outcome = await applyPlaybackPattern({
      fetchCount: () => fetchAffectedPrograms("compositions", id).then((affected) => affected.programCount),
      confirm,
      // Re-read at Apply so only the chosen Zones change and the revision is the latest, never the one
      // loaded with the preview: a Layout edited elsewhere meanwhile is not overwritten.
      write: async () => {
        try {
          const detail = await fetchComposition(id);
          const bindings = withZonePlayModes(bindingsFromCompositionZones(detail.zones), picked);
          await setCompositionZones(id, toSetZonesPayload(detail.zones.map((zone) => zone.layout_zone_id), bindings), detail.revision);
        } catch (err) {
          sawConflict.current = isConflict(err instanceof Error ? err.message : String(err));
          throw err;
        }
      },
    });
    setSaving(false);
    if (outcome.kind === "saved") {
      setChanges({});
      onLayoutChanged?.();
    } else if (outcome.kind === "count-failed") {
      setError("ตรวจสอบ Program ที่ใช้ Layout นี้ไม่สำเร็จ — ยังไม่ได้บันทึก ลองอีกครั้ง");
    } else if (outcome.kind === "save-failed") {
      setError(sawConflict.current ? "Layout ถูกแก้ไขจากที่อื่น — โหลดข้อมูลใหม่แล้วลองอีกครั้ง" : "บันทึกรูปแบบการเล่นไม่สำเร็จ — ลองอีกครั้ง");
      if (sawConflict.current) {
        setChanges({});
        onLayoutChanged?.();
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {zones.map((zone) => (
          <li
            key={zone.id}
            className="rounded-lg border border-border px-3 py-2"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-medium text-foreground">{zone.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{zone.seconds > 0 ? formatDuration(zone.seconds) : "ยังไม่มีสื่อ"}</span>
            </div>
            {zone.hasContent && (
              <div
                role="radiogroup"
                aria-label={`Play mode — ${zone.name}`}
                className="mt-1.5 flex gap-4"
              >
                {(["sequential", "shuffle"] as const).map((mode) => (
                  <label
                    key={mode}
                    className="flex cursor-pointer items-center gap-1.5 text-xs text-foreground"
                  >
                    <input
                      type="radio"
                      name={`zone-play-mode-${zone.id}`}
                      className="accent-primary"
                      checked={modeOf(zone) === mode}
                      disabled={saving}
                      onChange={() => choose(zone, mode)}
                    />
                    {mode === "shuffle" ? "Shuffle" : "Play in Order"}
                  </label>
                ))}
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {[
                zone.repeat === "once" ? "Play Once" : "Repeat All",
                zone.fit ? `Fit: ${zone.fit}` : null,
                zone.isMuted ? "Muted" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </li>
        ))}
      </ul>
      {isChanged && <SharedWriteNote subject="Layout" />}
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      {isChanged && (
        <Button
          variant="outline"
          disabled={saving}
          onClick={apply}
        >
          {saving ? "Saving…" : "Apply play modes"}
        </Button>
      )}
      {dialog}
    </div>
  );
}
