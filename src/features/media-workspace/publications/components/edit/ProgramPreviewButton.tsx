"use client";

import { useState } from "react";
import { Button } from "@/components/ui/lovable/button";
import { fetchMediaAsset } from "@/lib/api/media-api";
import { decodeMetadata, fetchPlaylist } from "@/features/media-workspace/playlists";
import { loadCompositionPreview, type StagePreview } from "@/features/media-workspace/preview/composition-preview";
import { PlaybackPreviewModal } from "@/features/media-workspace/preview/PlaybackPreviewModal";
import { playlistItemToPreview, playlistPreviewStage } from "@/features/media-workspace/preview/playlist-preview";
import type { MediaAsset } from "@/types/domain";
import type { ProgramContent } from "../../program-edit";

type Loaded = { preview: StagePreview; assets: MediaAsset[] };

async function loadPreview(content: ProgramContent): Promise<StagePreview> {
  if (content.type === "composition" && content.compositionId) {
    return loadCompositionPreview(content.compositionId);
  }
  if (content.playlistId) {
    const playlist = await fetchPlaylist(content.playlistId);
    return playlistPreviewStage({
      name: playlist.name,
      items: playlist.items.map(playlistItemToPreview),
      playback: decodeMetadata(playlist.metadata).playback,
    });
  }
  throw new Error("This Program has no previewable content");
}

/** Loads the Program's stage on first click, so opening the Edit page costs no preview fetch. */
export function ProgramPreviewButton({ content }: { content: ProgramContent }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  const show = () => {
    if (loaded) return setOpen(true);
    setLoading(true);
    setFailed(false);
    loadPreview(content)
      .then(async (preview) => {
        const ids = [...new Set(preview.zones.flatMap((z) => z.items.map((i) => i.mediaAssetId)))];
        const assets = await Promise.all(ids.map((id) => fetchMediaAsset(id)));
        setLoaded({ preview, assets });
        setOpen(true);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };

  return (
    <>
      <Button
        variant="outline"
        disabled={loading}
        onClick={show}
        title={failed ? "Preview failed to load — click to retry" : undefined}
      >
        {loading ? "Loading…" : failed ? "Retry preview" : "Preview"}
      </Button>
      {loaded && (
        <PlaybackPreviewModal
          open={open}
          onClose={() => setOpen(false)}
          zones={loaded.preview.zones}
          assets={loaded.assets}
          aspectRatio={loaded.preview.aspectRatio}
          referenceResolution={loaded.preview.referenceResolution}
          layoutName={loaded.preview.contentName}
        />
      )}
    </>
  );
}
