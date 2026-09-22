"use client";

import { Card } from "@/components/ui/Card";
import { PLAY_MODES, REPEAT_MODES, START_FROMS, TRANSITIONS, type PlaylistPlayback } from "../types";
import { Field, Select, inputClasses } from "./form";

const asOptions = <T extends string>(values: readonly T[]) => values.map((v) => ({ value: v, label: v }));

/** #36 center-bottom: the three keys that reach the player (play mode / repeat / start from —
 *  ADR 0031) plus the playlist-level transition defaults. Respect-item-duration and channel-sync
 *  are deliberately absent (no reader / belongs to the Channel). */
export function PlaylistPlaybackSettings({
  playback,
  onPlayback,
}: {
  playback: PlaylistPlayback;
  onPlayback: (patch: Partial<PlaylistPlayback>) => void;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Playback Settings</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Play Mode">
          <Select
            value={playback.playMode ?? "sequential"}
            options={asOptions(PLAY_MODES)}
            onChange={(e) => onPlayback({ playMode: e.target.value as PlaylistPlayback["playMode"] })}
          />
        </Field>
        <Field label="Repeat">
          <Select
            value={playback.repeat ?? "loop"}
            options={asOptions(REPEAT_MODES)}
            onChange={(e) => onPlayback({ repeat: e.target.value as PlaylistPlayback["repeat"] })}
          />
        </Field>
        <Field label="Start Playback From">
          <Select
            value={playback.startFrom ?? "first"}
            options={asOptions(START_FROMS)}
            onChange={(e) => onPlayback({ startFrom: e.target.value as PlaylistPlayback["startFrom"] })}
          />
        </Field>
        <Field label="Default Transition">
          <Select
            value={playback.defaultTransition ?? "fade"}
            options={asOptions(TRANSITIONS)}
            onChange={(e) => onPlayback({ defaultTransition: e.target.value as PlaylistPlayback["defaultTransition"] })}
          />
        </Field>
        <Field label="Transition Duration (seconds)">
          <input
            type="number"
            min={0}
            step={0.5}
            value={playback.transitionDuration ?? 1}
            onChange={(e) => onPlayback({ transitionDuration: Math.max(0, Number(e.target.value) || 0) })}
            className={inputClasses}
          />
        </Field>
      </div>
      <p className="text-xs text-zinc-400">
        Play mode, repeat and start-from reach the player only for a Playlist published on its own —
        a Composition Zone overrides them (ADR 0060 §3b).
      </p>
    </Card>
  );
}
