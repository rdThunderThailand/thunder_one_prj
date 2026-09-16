"use client";

import { useEffect, useRef } from "react";
import type { MediaAsset } from "@/types/domain";
import { draftItemToPreview, playlistPreviewStage } from "@/features/media-workspace/preview/playlist-preview";
import type { DraftItem, PlaylistPlayback } from "./types";

export type PlaylistPreviewSnapshot = {
  /** The row id, or `null` for an unsaved Playlist (opens the `new` route segment). */
  id: string | null;
  name: string;
  items: DraftItem[];
  playback: PlaylistPlayback;
  /** Only the assets the items reference — the handoff carries no others, no preview URLs. */
  assets: MediaAsset[];
};

/** ADR 0061 §4: preview opens from the live editor over a `BroadcastChannel`, never by id.
 *  The id is captured when the tab opens and kept for the channel's lifetime so a save
 *  mid-preview neither invalidates the handoff nor restarts the clock. */
export function usePlaylistPreviewHandoff(getSnapshot: () => PlaylistPreviewSnapshot) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const snapshotRef = useRef(getSnapshot);
  useEffect(() => {
    snapshotRef.current = getSnapshot;
  });

  useEffect(() => {
    const close = () => {
      channelRef.current?.postMessage({ type: "close" });
      channelRef.current?.close();
    };
    window.addEventListener("beforeunload", close);
    return () => {
      window.removeEventListener("beforeunload", close);
      close();
    };
  }, []);

  const openPreview = () => {
    const opened = snapshotRef.current();
    if (opened.items.length === 0) return;
    const handoffId = opened.id ?? "new";
    channelRef.current?.close();
    const channelName = `thunder-one-preview:${crypto.randomUUID()}`;
    const channel = new BroadcastChannel(channelName);
    let lastSent = "";
    channel.onmessage = ({ data }: MessageEvent<{ type?: string }>) => {
      if (data?.type !== "connect" && data?.type !== "heartbeat") return;
      const current = snapshotRef.current();
      const stage = playlistPreviewStage({
        name: current.name,
        items: current.items.map(draftItemToPreview),
        playback: current.playback,
      });
      const handoff = { ...stage, source: "playlist" as const, id: handoffId, assets: current.assets };
      // Re-post only when the payload actually changed — a `connect` always sends, but an
      // unchanged heartbeat must not hand the stage a fresh `zones` array every 2s.
      const fingerprint = JSON.stringify(handoff);
      if (data.type === "connect" || fingerprint !== lastSent) {
        lastSent = fingerprint;
        channel.postMessage({ type: "handoff", handoff });
      }
      channel.postMessage({ type: "heartbeat-reply" });
    };
    channelRef.current = channel;
    const segment = handoffId === "new" ? "new" : encodeURIComponent(handoffId);
    window.open(
      `/media-workspace/preview/playlist/${segment}?previewSession=${encodeURIComponent(channelName)}`,
      "_blank",
      "noopener",
    );
  };

  return { openPreview };
}
