"use client";

import { useEffect, useRef } from "react";
import type { MediaAsset } from "@/types/domain";
import type { StagePreview } from "@/features/media-workspace/preview/composition-preview";

type Handoff = StagePreview & { source: "publication"; id: string; assets: MediaAsset[] };

/**
 * Opens the draft in the full-screen preview tab (ADR 0061 §4). The draft is normally unsaved,
 * so — like the Playlist and Composition editors — it is handed over live on a random
 * `BroadcastChannel` rather than by id in the URL. `getHandoff` is read on every connect/heartbeat
 * so edits made while the tab is open are reflected.
 */
export function usePublicationPreviewHandoff(getHandoff: () => { preview: StagePreview; assets: MediaAsset[]; publicationId: string | null } | null) {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const getHandoffRef = useRef(getHandoff);
  useEffect(() => {
    getHandoffRef.current = getHandoff;
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

  const openFullPreview = () => {
    const snapshot = getHandoffRef.current();
    if (!snapshot) return;
    const id = snapshot.publicationId ?? "draft";
    channelRef.current?.close();
    const channelName = `thunder-one-preview:${crypto.randomUUID()}`;
    const channel = new BroadcastChannel(channelName);
    let lastSent = "";
    channel.onmessage = ({ data }: MessageEvent<{ type?: string }>) => {
      if (data?.type !== "connect" && data?.type !== "heartbeat") return;
      const current = getHandoffRef.current();
      if (!current) return;
      const referenced = new Set(current.preview.zones.flatMap((zone) => zone.items.map((item) => item.mediaAssetId)));
      const handoff: Handoff = {
        ...current.preview,
        source: "publication",
        id: current.publicationId ?? "draft",
        assets: current.assets.filter((asset) => referenced.has(asset.id)),
      };
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
    window.open(
      `/media-workspace/preview/publication/${encodeURIComponent(id)}?previewSession=${encodeURIComponent(channelName)}`,
      "_blank",
      "noopener",
    );
  };

  return { openFullPreview };
}
