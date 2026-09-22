"use client";

import { useEffect, useReducer, useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { XIcon } from "@/components/ui/icons";
import { fetchMediaAssets } from "@/lib/api/media-api";
import type { MediaAsset } from "@/types/domain";
import { fetchPublication } from "@/features/media-workspace/publications";
import { decodeMetadata, fetchPlaylist } from "@/features/media-workspace/playlists";
import { loadCompositionPreview, type StagePreview } from "./composition-preview";
import { playlistItemToPreview, playlistPreviewStage } from "./playlist-preview";
import { PlaylistPreviewContent } from "./PlaylistPreviewContent";
import { PreviewStage } from "./PreviewStage";
import { initialPreviewSession, reducePreviewSession } from "./preview-session";

export type PreviewSource = "composition" | "publication" | "playlist";
type PreviewHandoff = StagePreview & { source: PreviewSource; id: string; assets: MediaAsset[] };
type PreviewMessage =
  | { type: "connect" | "heartbeat" }
  | { type: "heartbeat-reply" | "close" }
  | { type: "handoff"; handoff: PreviewHandoff };

function isHandoff(value: unknown, source: PreviewSource, id: string): value is PreviewHandoff {
  if (!value || typeof value !== "object") return false;
  const handoff = value as Partial<PreviewHandoff>;
  return handoff.source === source
    && handoff.id === id
    && Array.isArray(handoff.zones)
    && Array.isArray(handoff.assets)
    && typeof handoff.aspectRatio === "string";
}

export function FullPreviewPage({ id, source, sessionName }: { id: string; source: PreviewSource; sessionName?: string }) {
  const [channelName] = useState(() => sessionName?.startsWith("thunder-one-preview:") ? sessionName : null);
  const [session, dispatch] = useReducer(reducePreviewSession, initialPreviewSession);
  const [handoff, setHandoff] = useState<PreviewHandoff | null>(null);
  const [preview, setPreview] = useState<StagePreview | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!channelName) return;
    const channel = new BroadcastChannel(channelName);
    const connect = () => channel.postMessage({ type: "connect" } satisfies PreviewMessage);
    const heartbeat = window.setInterval(() => {
      dispatch("heartbeatMissed");
      channel.postMessage({ type: "heartbeat" } satisfies PreviewMessage);
    }, 2000);
    channel.onmessage = ({ data }: MessageEvent<PreviewMessage>) => {
      if (data?.type === "handoff" && isHandoff(data.handoff, source, id)) {
        setHandoff(data.handoff);
        dispatch("heartbeatReply");
      } else if (data?.type === "heartbeat-reply") {
        dispatch("heartbeatReply");
      } else if (data?.type === "close") {
        dispatch("close");
      }
    };
    connect();
    return () => {
      window.clearInterval(heartbeat);
      channel.close();
    };
  }, [channelName, id, source]);

  useEffect(() => {
    if (handoff || channelName) return;
    let alive = true;
    const load = async () => {
      try {
        const loaded = source === "playlist"
          ? await loadPlaylistPreview(id)
          : await loadCompositionOrPublicationPreview(source, id);
        const assetIds = new Set(loaded.zones.flatMap((zone) => zone.items.map((item) => item.mediaAssetId)));
        const allAssets = await fetchMediaAssets();
        if (!alive) return;
        setPreview(loaded);
        setAssets(allAssets.filter((asset) => assetIds.has(asset.id)));
      } catch {
        if (alive) setError("โหลด Content สำหรับ preview ไม่สำเร็จ");
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [channelName, handoff, id, source]);

  const loadedPreview = handoff ?? preview;
  const loadedAssets = handoff?.assets ?? assets;

  if (channelName && (session.status === "expired" || session.status === "closed")) {
    return <PreviewExpired />;
  }
  if (error) return <p className="p-6 text-sm text-danger" role="alert">{error}</p>;
  if (!loadedPreview) return <p className="p-6 text-sm text-muted-foreground">Loading preview…</p>;

  if (source === "playlist" && loadedPreview.zones[0]) {
    return <PlaylistFullPreview preview={loadedPreview} assets={loadedAssets} />;
  }

  return (
    <main className="min-h-full bg-foreground p-4 sm:p-6">
      <PreviewStage
        zones={loadedPreview.zones}
        assets={loadedAssets}
        aspectRatio={loadedPreview.aspectRatio}
        referenceResolution={loadedPreview.referenceResolution}
      />
    </main>
  );
}

async function loadCompositionOrPublicationPreview(source: Exclude<PreviewSource, "playlist">, id: string): Promise<StagePreview> {
  const compositionId = source === "composition"
    ? id
    : (await fetchPublication(id)).composition?.id;
  if (!compositionId) throw new Error("Publication นี้ไม่มี Composition สำหรับ preview");
  return loadCompositionPreview(compositionId);
}

async function loadPlaylistPreview(id: string): Promise<StagePreview> {
  if (id === "new") throw new Error("Playlist นี้ยังไม่ได้บันทึก");
  const playlist = await fetchPlaylist(id);
  const { playback } = decodeMetadata(playlist.metadata);
  return playlistPreviewStage({
    name: playlist.name,
    items: playlist.items.map(playlistItemToPreview),
    playback,
  });
}

function PlaylistFullPreview({ preview, assets }: { preview: StagePreview; assets: MediaAsset[] }) {
  const zone = preview.zones[0];
  return (
    <main className="min-h-full bg-program p-4 text-background sm:p-6">
      <div className="w-full">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-background/15 bg-background/5 px-4 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => window.close()}
              aria-label="Close preview"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-background/70 hover:bg-background/10 hover:text-background"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold tracking-tight text-background">Preview Playlist</h1>
              <p className="mt-1 text-sm text-background/70">{zone.name} · {zone.items.length} items</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.close()}>Edit Playlist</Button>
            <Button disabled title="Publish from Playlist editor">Publish</Button>
          </div>
        </header>
        <div className="pt-5">
          <PlaylistPreviewContent preview={preview} assets={assets} />
        </div>
      </div>
    </main>
  );
}

function PreviewExpired() {
  return (
    <main className="flex min-h-full items-center justify-center bg-foreground p-6">
      <div className="max-w-sm rounded-xl bg-card p-6 text-center shadow-lg">
        <p className="text-sm font-medium text-foreground">Preview session expired — reopen from editor</p>
        <Button className="mt-4" variant="outline" onClick={() => window.close()}>Close tab</Button>
      </div>
    </main>
  );
}
