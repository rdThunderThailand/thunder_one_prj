"use client";

import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { setPlaylistPlayMode } from "@/features/media-workspace/playlists";
import { fetchAffectedPrograms } from "@/features/media-workspace/publish-changes/publish-changes-api";
import { applyPlaybackPattern } from "../playback-pattern-apply";
import { PlaybackPatternField, type PatternChoice } from "./edit/schedule/PlaybackPatternField";
import { SharedWriteNote, useSharedWriteConfirm } from "./SharedWriteConfirm";

/** How to Play for a Playlist Program: the Playlist's Playback Pattern, changed in place with its own
 *  Apply (ADR 0083). The write goes to the shared Playlist immediately, so it re-counts the Programs
 *  using it and asks first when there are any. */
export function PlaylistPatternControl({
  playlistId,
  onPlaylistChanged,
}: {
  playlistId: string;
  onPlaylistChanged?: () => void;
}) {
  const [choice, setChoice] = useState<PatternChoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useSharedWriteConfirm("Playlist");

  const isChanged = choice !== null && choice.selected !== choice.original;

  const apply = async () => {
    if (!choice || saving) return;
    const id = playlistId;
    const mode = choice.selected;
    setSaving(true);
    setError(null);
    const outcome = await applyPlaybackPattern({
      fetchCount: () => fetchAffectedPrograms("playlists", id).then((affected) => affected.programCount),
      confirm,
      write: () => setPlaylistPlayMode(id, mode),
    });
    setSaving(false);
    if (outcome.kind === "saved") {
      setChoice({ original: mode, selected: mode });
      onPlaylistChanged?.();
    } else if (outcome.kind === "count-failed") {
      setError("ตรวจสอบ Program ที่ใช้ Playlist นี้ไม่สำเร็จ — ยังไม่ได้บันทึก ลองอีกครั้ง");
    } else if (outcome.kind === "save-failed") {
      setError("บันทึกรูปแบบการเล่นไม่สำเร็จ — ลองอีกครั้ง");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <PlaybackPatternField
        playlistId={playlistId}
        choice={choice}
        onChange={setChoice}
        disabled={saving}
        showIndex={false}
        note={<SharedWriteNote subject="Playlist" />}
      />
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      {isChanged && (
        <Button
          variant="outline"
          disabled={saving}
          onClick={apply}
        >
          {saving ? "Saving…" : "Apply pattern"}
        </Button>
      )}

      {dialog}
    </div>
  );
}
