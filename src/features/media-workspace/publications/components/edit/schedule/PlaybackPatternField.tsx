"use client";

import { useEffect, useState } from "react";
import { decodeMetadata, fetchPlaylist } from "@/features/media-workspace/playlists";
import type { PlayMode } from "@/features/media-workspace/playlists/types";
import { fetchAffectedPrograms } from "@/features/media-workspace/publish-changes/publish-changes-api";

export type PatternChoice = { original: PlayMode; selected: PlayMode };

const OPTIONS: { value: PlayMode | "single"; label: string; hint: string }[] = [
  { value: "sequential", label: "Play sequentially", hint: "เล่นตามลำดับใน Playlist ที่เลือก" },
  { value: "shuffle", label: "Shuffle", hint: "สุ่มลำดับการเล่น" },
  { value: "single", label: "Repeat single item", hint: "เล่นรายการเดียวซ้ำตลอดช่วงเวลา" },
];

/**
 * Frame 08 step 3. Sequential / Shuffle is the bound Playlist's own `play_mode` (plan §2 FE-E), so it is
 * written to the Playlist on Apply and reaches every Program that uses it. The other controls have no
 * backing field yet and stay disabled; a Layout has no single Playlist, so the section is disabled.
 */
export function PlaybackPatternField({
  playlistId,
  choice,
  onChange,
}: {
  playlistId: string | null;
  choice: PatternChoice | null;
  onChange: (choice: PatternChoice) => void;
}) {
  const [programCount, setProgramCount] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!playlistId) return;
    let cancelled = false;
    Promise.all([fetchPlaylist(playlistId), fetchAffectedPrograms("playlists", playlistId)])
      .then(([playlist, affected]) => {
        if (cancelled) return;
        const mode = decodeMetadata(playlist.metadata).playback.playMode ?? "sequential";
        onChange({ original: mode, selected: mode });
        setProgramCount(affected.programCount);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
    // `onChange` is the parent's setter; loading once per Playlist is the intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  const isDisabled = !playlistId || !choice;
  const isChanged = choice !== null && choice.selected !== choice.original;

  return (
    <section className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        3
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Playback Pattern (Optional)</h3>
          <p className="text-xs text-muted-foreground">
            {playlistId ? "รูปแบบการเล่นภายในช่วงเวลา" : "Layout กำหนดการเล่นในแต่ละ Zone — แก้ได้ที่หน้า Layout"}
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Playback Pattern"
          className="flex flex-col gap-2"
        >
          {OPTIONS.map((option) => {
            const isSingle = option.value === "single";
            const isOn = choice?.selected === option.value;
            return (
              <label
                key={option.value}
                className={`flex items-start gap-2 ${isDisabled || isSingle ? "opacity-50" : "cursor-pointer"}`}
                title={isSingle ? "เร็วๆ นี้" : undefined}
              >
                <input
                  type="radio"
                  name="playback-pattern"
                  className="mt-1 accent-primary"
                  checked={isOn}
                  disabled={isDisabled || isSingle}
                  onChange={() => choice && !isSingle && onChange({ ...choice, selected: option.value as PlayMode })}
                />
                <span>
                  <span className="block text-sm font-medium text-foreground">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
        {failed && <p className="text-xs text-danger">Could not load the Playlist&apos;s playback settings.</p>}
        {isChanged && (
          <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">
            This changes the Playlist itself
            {programCount !== null && ` — used by ${programCount} active or scheduled Program${programCount === 1 ? "" : "s"}`}.
            It is saved when you apply; other Programs pick it up on their next Publish Changes.
          </p>
        )}
      </div>
    </section>
  );
}
