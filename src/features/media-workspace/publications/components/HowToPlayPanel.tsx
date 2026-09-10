"use client";

import Link from "next/link";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import { decodeMetadata } from "@/features/media-workspace/playlists";
import type { DraftAssetItem, MediaAsset } from "../types";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { usePlaylistPreview } from "../hooks/usePlaylistPreview";
import { SelectedAssetList } from "./SelectedAssetList";

/** Frame 3 "3. How to Play". Loose media gets item order + per-item transition (SHIP); play
 *  order / repeat are the player's defaults, shown READ-ONLY (nothing stores them — see the
 *  persistence note in plan-create-wizard.md). Playlist / Composition show their source's own
 *  values with a link to its editor. */
export function HowToPlayPanel({ assets }: { assets: MediaAsset[] }) {
  const type = usePublicationDraftStore((s) => s.basicInfo.publicationType);
  const playlistId = usePublicationDraftStore((s) => s.playlistId);
  const compositionId = usePublicationDraftStore((s) => s.compositionId);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const setAssetDuration = usePublicationDraftStore((s) => s.setAssetDuration);
  const setAssetTransition = usePublicationDraftStore((s) => s.setAssetTransition);
  const moveAssetItem = usePublicationDraftStore((s) => s.moveAssetItem);
  const toggleAssetItem = usePublicationDraftStore((s) => s.toggleAssetItem);

  if (type === "playlist") return <PlaylistHowTo playlistId={playlistId} />;
  if (type === "composition") return <CompositionHowTo compositionId={compositionId} />;

  if (assetItems.length === 0) {
    return <p className="text-xs text-zinc-400">เลือกคอนเทนต์ในขั้นตอนที่ 1 เพื่อตั้งค่าการเล่น</p>;
  }

  return (
    <LooseMediaHowTo
      assets={assets}
      assetItems={assetItems}
      setAssetDuration={setAssetDuration}
      setAssetTransition={setAssetTransition}
      moveAssetItem={moveAssetItem}
      toggleAssetItem={toggleAssetItem}
    />
  );
}

function LooseMediaHowTo({
  assets,
  assetItems,
  ...selection
}: {
  assets: MediaAsset[];
  assetItems: DraftAssetItem[];
  setAssetDuration: (id: string, s: number | null) => void;
  setAssetTransition: (id: string, t: "cut" | "fade") => void;
  moveAssetItem: (id: string, d: -1 | 1) => void;
  toggleAssetItem: (a: { id: string; isImage: boolean }) => void;
}) {
  const previews = usePreviewUrls(assetItems.map((i) => i.media_asset_id));

  return (
    <div className="flex flex-col gap-4">
      <SelectedAssetList
        assets={assets}
        previews={previews.urls}
        bare
        selection={{ assetItems, ...selection }}
      />

      <div className="flex flex-col gap-2 border-t border-zinc-100 pt-3">
        <ReadOnlyRow label="Play Order" value="Play in Order — เล่นตามลำดับ" hint="ค่าเริ่มต้นของเครื่องเล่น" />
        <ReadOnlyRow label="Repeat" value="Repeat All — วนซ้ำทั้งหมด" hint="ค่าเริ่มต้นของเครื่องเล่น" />
      </div>

      <div className="flex flex-col gap-3 opacity-60">
        <div>
          <p className="text-sm font-medium text-zinc-400">Transition duration</p>
          <input
            type="text"
            disabled
            value="2 sec"
            title="ยังไม่เปิดใช้งาน"
            className="mt-1 w-24 cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-sm text-zinc-400"
          />
        </div>
        <label className="flex cursor-not-allowed items-center gap-2 text-sm text-zinc-400" title="ยังไม่เปิดใช้งาน">
          <input type="checkbox" disabled className="h-4 w-4" />
          Audio
        </label>
      </div>
    </div>
  );
}

function PlaylistHowTo({ playlistId }: { playlistId: string | null }) {
  const { playlist, failed } = usePlaylistPreview(playlistId, Boolean(playlistId));

  if (!playlistId) return <p className="text-xs text-zinc-400">ยังไม่ได้เลือก Playlist</p>;
  if (failed) return <p className="text-xs text-red-600">โหลดข้อมูล Playlist ไม่สำเร็จ</p>;
  if (!playlist) return <p className="text-xs text-zinc-400">กำลังโหลด…</p>;

  const { playback } = decodeMetadata(playlist.metadata);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500">การเล่นเป็นไปตามที่ตั้งค่าไว้ใน Playlist นี้</p>
      <ReadOnlyRow label="Play Mode" value={playback.playMode ?? "sequential"} />
      <ReadOnlyRow label="Repeat" value={playback.repeat ?? "loop"} />
      <ReadOnlyRow label="Start From" value={playback.startFrom ?? "first"} />
      <ReadOnlyRow label="Transition" value={playback.defaultTransition ?? "fade"} />
      <ReadOnlyRow label="Transition duration" value={`${playback.transitionDuration ?? 1} sec`} />
      <Link
        href={`/media-workspace/playlists/${playlistId}`}
        className="mt-1 text-xs font-medium text-indigo-600 hover:text-indigo-500"
      >
        แก้ไขใน Playlist editor ↗
      </Link>
    </div>
  );
}

function CompositionHowTo({ compositionId }: { compositionId: string | null }) {
  if (!compositionId) return <p className="text-xs text-zinc-400">ยังไม่ได้เลือก Layout</p>;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-zinc-500">
        การเล่นของแต่ละโซนเป็นไปตามที่ตั้งค่าไว้ใน Layout นี้
      </p>
      <Link
        href={`/media-workspace/layouts/${compositionId}`}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
      >
        แก้ไขใน Layout editor ↗
      </Link>
    </div>
  );
}

function ReadOnlyRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right">
        <span className="font-medium capitalize text-zinc-900">{value}</span>
        {hint && <span className="block text-[11px] font-normal text-zinc-400">{hint}</span>}
      </span>
    </div>
  );
}
