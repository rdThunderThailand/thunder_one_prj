"use client";

import Link from "next/link";
import { ExternalLinkIcon } from "@/components/ui/icons";
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
    return <p className="text-xs text-muted-foreground">เลือกคอนเทนต์ในขั้นตอนที่ 1 เพื่อตั้งค่าการเล่น</p>;
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

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <ReadOnlyRow label="Play Order" value="Play in Order — เล่นตามลำดับ" hint="ค่าเริ่มต้นของเครื่องเล่น" />
        <ReadOnlyRow label="Repeat" value="Repeat All — วนซ้ำทั้งหมด" hint="ค่าเริ่มต้นของเครื่องเล่น" />
      </div>

      <div className="flex flex-col gap-3 opacity-60">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Transition duration</p>
          <input
            type="text"
            disabled
            value="2 sec"
            title="ยังไม่เปิดใช้งาน"
            className="mt-1 w-24 cursor-not-allowed rounded-lg border border-border bg-muted px-2 py-1 text-sm text-muted-foreground"
          />
        </div>
        <label className="flex cursor-not-allowed items-center gap-2 text-sm text-muted-foreground" title="ยังไม่เปิดใช้งาน">
          <input type="checkbox" disabled className="h-4 w-4" />
          Audio
        </label>
      </div>
    </div>
  );
}

function PlaylistHowTo({ playlistId }: { playlistId: string | null }) {
  const { playlist, failed } = usePlaylistPreview(playlistId, Boolean(playlistId));

  if (!playlistId) return <p className="text-xs text-muted-foreground">ยังไม่ได้เลือก Playlist</p>;
  if (failed) return <p className="text-xs text-danger">โหลดข้อมูล Playlist ไม่สำเร็จ</p>;
  if (!playlist) return <p className="text-xs text-muted-foreground">กำลังโหลด…</p>;

  const { playback } = decodeMetadata(playlist.metadata);
  const playOrder = playback.playMode === "shuffle" ? "Shuffle · สุ่มลำดับ" : "Play in Order · เล่นตามลำดับ";
  const repeat = playback.repeat === "once" ? "Play Once · เล่นครั้งเดียว" : "Repeat All · วนซ้ำทั้งหมด";

  return (
    <div className="flex flex-col gap-4">
      <ReadOnlyField label="Play Order" value={playOrder} />
      <ReadOnlyField label="Repeat" value={repeat} />
      <div className="grid grid-cols-2 gap-3">
        <ReadOnlyField label="Transition" value={playback.defaultTransition ?? "fade"} capitalize />
        <ReadOnlyField label="Duration" value={`${playback.transitionDuration ?? 1} sec`} />
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Audio</span>
          <input type="checkbox" checked={playback.audioEnabled ?? true} disabled className="h-4 w-4 accent-primary disabled:opacity-100" />
        </div>
        <label className="mt-4 block text-xs font-medium text-muted-foreground">
          Volume
          <span className="mt-2 flex items-center gap-3">
            <input type="range" min="0" max="100" value={playback.defaultVolume ?? 100} disabled className="h-1.5 min-w-0 flex-1 accent-primary disabled:opacity-100" />
            <span className="w-10 text-right text-sm font-semibold text-muted-foreground">{playback.defaultVolume ?? 100}%</span>
          </span>
        </label>
      </div>

      <Link
        href={`/media-workspace/playlists/${playlistId}`}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-primary hover:border-primary/30 hover:bg-primary-soft"
      >
        แก้ไขใน Playlist Editor <ExternalLinkIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}

function ReadOnlyField({ label, value, capitalize = false }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <input
        type="text"
        value={value}
        readOnly
        className={`mt-1.5 w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm font-medium text-foreground outline-none ${capitalize ? "capitalize" : ""}`}
      />
    </label>
  );
}

function CompositionHowTo({ compositionId }: { compositionId: string | null }) {
  if (!compositionId) return <p className="text-xs text-muted-foreground">ยังไม่ได้เลือก Layout</p>;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        การเล่นของแต่ละโซนเป็นไปตามที่ตั้งค่าไว้ใน Layout นี้
      </p>
      <Link
        href={`/media-workspace/layouts/${compositionId}`}
        className="text-xs font-medium text-primary hover:text-primary"
      >
        แก้ไขใน Layout editor ↗
      </Link>
    </div>
  );
}

function ReadOnlyRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">
        <span className="font-medium capitalize text-foreground">{value}</span>
        {hint && <span className="block text-[11px] font-normal text-muted-foreground">{hint}</span>}
      </span>
    </div>
  );
}
