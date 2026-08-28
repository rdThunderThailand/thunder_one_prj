"use client";

import { useEffect, useReducer, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fetchMediaAssets } from "@/lib/api/media-api";
import type { MediaAsset } from "@/types/domain";
import { fetchPublication } from "@/features/media-workspace/publications";
import { loadCompositionPreview, type CompositionPreview } from "./composition-preview";
import { PreviewStage } from "./PreviewStage";
import { initialPreviewSession, reducePreviewSession } from "./preview-session";

type PreviewHandoff = CompositionPreview & { compositionId: string; assets: MediaAsset[] };
type PreviewMessage =
  | { type: "connect" | "heartbeat" }
  | { type: "heartbeat-reply" | "close" }
  | { type: "handoff"; handoff: PreviewHandoff };

function isHandoff(value: unknown, compositionId: string): value is PreviewHandoff {
  if (!value || typeof value !== "object") return false;
  const handoff = value as Partial<PreviewHandoff>;
  return handoff.compositionId === compositionId
    && Array.isArray(handoff.zones)
    && Array.isArray(handoff.assets)
    && typeof handoff.aspectRatio === "string";
}

export function FullPreviewPage({ id, source, sessionName }: { id: string; source: "composition" | "publication"; sessionName?: string }) {
  const [channelName] = useState(() => sessionName?.startsWith("thunder-one-preview:") ? sessionName : null);
  const [session, dispatch] = useReducer(reducePreviewSession, initialPreviewSession);
  const [handoff, setHandoff] = useState<PreviewHandoff | null>(null);
  const [preview, setPreview] = useState<CompositionPreview | null>(null);
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
      if (data?.type === "handoff" && isHandoff(data.handoff, id)) {
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
  }, [channelName, id]);

  useEffect(() => {
    if (handoff || channelName) return;
    let alive = true;
    const load = async () => {
      try {
        const compositionId = source === "composition"
          ? id
          : (await fetchPublication(id)).composition?.id;
        if (!compositionId) throw new Error("Publication นี้ไม่มี Composition สำหรับ preview");
        const loaded = await loadCompositionPreview(compositionId);
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
  if (error) return <p className="p-6 text-sm text-red-600" role="alert">{error}</p>;
  if (!loadedPreview) return <p className="p-6 text-sm text-zinc-400">Loading preview…</p>;

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
