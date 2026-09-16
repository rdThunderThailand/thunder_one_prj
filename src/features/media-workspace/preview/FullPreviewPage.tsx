"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { XIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { fetchMediaAssets } from "@/lib/api/media-api";
import type { MediaAsset } from "@/types/domain";
import { fetchPublication } from "@/features/media-workspace/publications";
import { decodeMetadata, fetchPlaylist, formatDuration } from "@/features/media-workspace/playlists";
import { loadCompositionPreview, type StagePreview } from "./composition-preview";
import { playlistItemToPreview, playlistPreviewStage } from "./playlist-preview";
import { PlaylistPreviewPanel } from "./PlaylistPreviewPanel";
import { PreviewStage } from "./PreviewStage";
import { zoneSchedule, type PlaybackPreviewItem, type ZonePreviewFrame, type ZoneSchedule } from "./preview-clock";
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
  const [frame, setFrame] = useState<ZonePreviewFrame | null>(null);
  const [seekRequest, setSeekRequest] = useState<{ seconds: number; id: number } | null>(null);

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
  const isPlaylist = source === "playlist";
  const playlistZone = isPlaylist ? loadedPreview?.zones[0] : undefined;
  const panelItems = useMemo(() => {
    if (!playlistZone) return [];
    const durationById = Object.fromEntries(loadedAssets.map((asset) => [asset.id, asset.duration_seconds]));
    return playlistZone.items.map((item) => ({
      ...item,
      durationSeconds: item.durationSeconds ?? durationById[item.mediaAssetId],
    }));
  }, [loadedAssets, playlistZone]);

  if (channelName && (session.status === "expired" || session.status === "closed")) {
    return <PreviewExpired />;
  }
  if (error) return <p className="p-6 text-sm text-red-600" role="alert">{error}</p>;
  if (!loadedPreview) return <p className="p-6 text-sm text-zinc-400">Loading preview…</p>;

  if (isPlaylist && playlistZone) {
    return (
      <PlaylistFullPreview
        preview={loadedPreview}
        assets={loadedAssets}
        items={panelItems}
        frame={frame}
        seekRequest={seekRequest}
        onFrame={setFrame}
        onSeek={(seconds) => setSeekRequest((current) => ({ seconds, id: (current?.id ?? 0) + 1 }))}
      />
    );
  }

  return (
    <main className="min-h-full bg-zinc-950 p-4 sm:p-6">
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

function PlaylistFullPreview({
  preview,
  assets,
  items,
  frame,
  seekRequest,
  onFrame,
  onSeek,
}: {
  preview: StagePreview;
  assets: MediaAsset[];
  items: PlaybackPreviewItem[];
  frame: ZonePreviewFrame | null;
  seekRequest: { seconds: number; id: number } | null;
  onFrame: (frame: ZonePreviewFrame | null) => void;
  onSeek: (seconds: number) => void;
}) {
  const zone = preview.zones[0];
  // ADR 0062 §1: one schedule per Zone, memoised here and read by everything below it.
  const schedule = useMemo(() => zoneSchedule(items, zone.playback, zone.id), [items, zone.playback, zone.id]);
  const total = formatDuration(schedule.totalSeconds);
  // ADR 0061 §2: a Playlist has no geometry of its own, so the operator picks the frame.
  const [previewMode, setPreviewMode] = useState("16:9");
  return (
    <main className="min-h-full bg-white p-4 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:p-6">
      <div className="w-full">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => window.close()}
              aria-label="Close preview"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold">Preview Playlist</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {zone.name} · {items.length} items · Total duration {total}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => window.close()}>Edit Playlist</Button>
            <Button disabled title="Publish from Playlist editor">Publish</Button>
          </div>
        </header>

        <div className="grid gap-5 pt-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <div>
              <PreviewStage
                zones={preview.zones}
                assets={assets}
                aspectRatio={previewMode}
                referenceResolution={null}
                geometryOptions={[]}
                allowActualSize={false}
                controlsPlacement="overlay"
                seekRequest={seekRequest}
                onFrameChange={onFrame}
              />
            </div>
            <PlaylistTimelineStrip items={items} assets={assets} schedule={schedule} frame={frame} onSeek={onSeek} />
            <p className="mx-auto mt-5 max-w-3xl rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              This is a preview only. Actual playback may vary slightly depending on your screen and network.
            </p>
          </section>

          <PlaylistPreviewPanel
            name={zone.name}
            items={items}
            playback={zone.playback}
            totalSeconds={schedule.totalSeconds}
            frame={frame}
            assets={assets}
            tone="light"
            previewMode={previewMode}
            onPreviewMode={setPreviewMode}
          />
        </div>
      </div>
    </main>
  );
}

function PlaylistTimelineStrip({
  items,
  assets,
  schedule,
  frame,
  onSeek,
}: {
  items: PlaybackPreviewItem[];
  assets: MediaAsset[];
  schedule: ZoneSchedule;
  frame: ZonePreviewFrame | null;
  onSeek: (seconds: number) => void;
}) {
  const previews = usePreviewUrls(useMemo(() => items.map((item) => item.mediaAssetId), [items]));
  const assetById = useMemo(() => Object.fromEntries(assets.map((asset) => [asset.id, asset])), [assets]);
  return (
    <section className="mt-5">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Playlist Timeline <span className="font-normal text-zinc-500">(Total {formatDuration(schedule.totalSeconds)})</span>
      </h2>
      <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
        {items.map((item, index) => {
          const asset = assetById[item.mediaAssetId];
          const seconds = item.durationSeconds ?? asset?.duration_seconds ?? null;
          const active = frame?.item?.mediaAssetId === item.mediaAssetId;
          return (
            <button
              key={item.mediaAssetId}
              type="button"
              onClick={() => onSeek(schedule.starts[schedule.order.indexOf(index)] ?? 0)}
              className="w-48 shrink-0 text-left"
            >
              <span className={`relative block overflow-hidden rounded-lg border-2 ${active ? "border-indigo-600" : "border-transparent hover:border-zinc-300"}`}>
                <MediaThumb url={previews.urls[item.mediaAssetId]} kind={asset?.kind} alt={item.label ?? ""} className="h-24 w-full rounded-none" />
                <span className="absolute left-2 top-2 rounded-md bg-zinc-950/70 px-2 py-0.5 text-xs font-semibold text-white">{index + 1}</span>
              </span>
              <span className="mt-2 block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{item.label ?? "Untitled item"}</span>
              <span className="text-xs text-zinc-500">{asset?.kind === "video" ? "Video" : "Image"} · {seconds != null ? formatDuration(seconds) : "—"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PreviewExpired() {
  return (
    <main className="flex min-h-full items-center justify-center bg-zinc-950 p-6">
      <div className="max-w-sm rounded-xl bg-white p-6 text-center shadow-lg">
        <p className="text-sm font-medium text-zinc-900">Preview session expired — reopen from editor</p>
        <Button className="mt-4" variant="secondary" onClick={() => window.close()}>Close tab</Button>
      </div>
    </main>
  );
}
