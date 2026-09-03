"use client";

import { Card } from "@/components/ui/Card";
import { PLAY_MODES, REPEAT_MODES, START_FROMS, TRANSITIONS, type PlaylistPlayback } from "../types";
import { Field, Select, inputClasses } from "./form";

const asOptions = <T extends string>(values: readonly T[]) => values.map((v) => ({ value: v, label: v }));

/** The editor's right pane: name plus the playlist-level playback defaults. ADR 0060 §3b —
 *  play mode / repeat / start-from reach the player only on the flat Publication path. */
export function PlaylistPlaybackFields({
  name,
  playback,
  onName,
  onPlayback,
}: {
  name: string;
  playback: PlaylistPlayback;
  onName: (name: string) => void;
  onPlayback: (patch: Partial<PlaylistPlayback>) => void;
}) {
  return (
    <Card className="flex h-fit flex-col gap-4 p-5">
      <Field label="Playlist Name" required>
        <input value={name} onChange={(e) => onName(e.target.value)} className={inputClasses} maxLength={100} />
      </Field>
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
      <p className="text-xs text-zinc-400">
        Play mode, repeat and start-from reach the player only for a Playlist published on its own —
        a Composition Zone overrides them (ADR 0060 §3b).
      </p>
    </Card>
  );
}
