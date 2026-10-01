"use client";

import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
import { Button } from "@/components/ui/lovable/button";
import { setPlaylistPlayMode } from "@/features/media-workspace/playlists";
import { fetchAffectedPrograms } from "@/features/media-workspace/publish-changes/publish-changes-api";
import { applyPlaybackPattern } from "../playback-pattern-apply";
import { PlaybackPatternField, type PatternChoice } from "./edit/schedule/PlaybackPatternField";

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
  const [asking, setAsking] = useState<number | null>(null);
  const answer = useRef<((confirmed: boolean) => void) | null>(null);

  const isChanged = choice !== null && choice.selected !== choice.original;

  const settle = (confirmed: boolean) => {
    answer.current?.(confirmed);
    answer.current = null;
    setAsking(null);
  };

  const apply = async () => {
    if (!choice || saving) return;
    const id = playlistId;
    const mode = choice.selected;
    setSaving(true);
    setError(null);
    const outcome = await applyPlaybackPattern({
      fetchCount: () => fetchAffectedPrograms("playlists", id).then((affected) => affected.programCount),
      confirm: (count) =>
        new Promise<boolean>((resolve) => {
          answer.current = resolve;
          setAsking(count);
        }),
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
        note={
          <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning">
            การเปลี่ยนนี้บันทึกลง Playlist ทันทีเมื่อกด Apply และจะไม่ย้อนกลับแม้ทิ้ง draft นี้
          </p>
        }
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

      <AlertDialog open={asking !== null} onOpenChange={(open) => !open && settle(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>เปลี่ยนรูปแบบการเล่นของ Playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Playlist นี้ถูกใช้โดย {asking} Program ที่ active หรือ scheduled อยู่ การกด Apply จะบันทึกรูปแบบใหม่ลง Playlist ทันที
              แม้ภายหลังจะทิ้ง draft นี้ ค่าที่บันทึกแล้วก็จะยังอยู่ Program ที่เผยแพร่แล้วจะใช้รูปแบบใหม่เมื่อมีการ Publish Changes
              ที่ครอบคลุม Program นั้น
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => settle(true)}>Apply</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
