"use client";

import { useState } from "react";
import { LightbulbIcon, UploadIcon } from "@/components/ui/icons";
import { useAssetUpload } from "@/features/media-workspace/assets/useAssetUpload";
import type { MediaAsset, Tag } from "../types";
import { DEFAULT_IMAGE_DURATION_SECONDS, isImageAsset } from "../draft-mapping";
import { canSelectAsset } from "../content-selection";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { Dropzone } from "./Dropzone";
import { MediaPickerModal } from "./MediaPickerModal";
import { PlaylistPickerModal } from "./PlaylistPickerModal";

type Branch = "media" | "playlist" | "composition";

const branchCopy: Record<Branch, { title: string; description: string; tone: string }> = {
  media: { title: "MEDIA", description: "ไฟล์เดี่ยว เช่น รูปภาพหรือวิดีโอ", tone: "border-emerald-200" },
  playlist: { title: "PLAYLIST", description: "ลำดับรายการสื่อที่เล่นต่อเนื่อง", tone: "border-blue-200" },
  composition: { title: "LAYOUT", description: "ออกแบบหลายโซนและการจัดวาง", tone: "border-violet-200" },
};

export function AssetLibraryStep({
  assets,
  tags,
  reloadAssets,
  assetsLoading,
  assetsError,
}: {
  assets: MediaAsset[];
  tags: Tag[];
  reloadAssets: () => Promise<MediaAsset[]>;
  assetsLoading: boolean;
  assetsError: string | null;
}) {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const playlistId = usePublicationDraftStore((s) => s.playlistId);
  const compositionId = usePublicationDraftStore((s) => s.compositionId);
  const setBasicInfo = usePublicationDraftStore((s) => s.setBasicInfo);
  const setAssetItems = usePublicationDraftStore((s) => s.setAssetItems);
  const setPlaylistId = usePublicationDraftStore((s) => s.setPlaylistId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false);
  const publicationType = basicInfo.publicationType;

  const { fileInputRef, uploadPct, uploadError, uploadFile } = useAssetUpload(async (asset, isVideoFile) => {
    const refreshed = await reloadAssets();
    const selected = refreshed.find((candidate) => candidate.id === asset?.id) ?? asset;
    if (!selected || !canSelectAsset(publicationType, selected)) return;
    setAssetItems(assetItems.some((item) => item.media_asset_id === selected.id) ? assetItems : [...assetItems, {
      media_asset_id: selected.id,
      duration_seconds: isVideoFile ? null : DEFAULT_IMAGE_DURATION_SECONDS,
      transition: "cut",
    }]);
  });

  const selectedBranch: Branch = publicationType === "playlist" ? "playlist" : publicationType === "composition" ? "composition" : "media";
  const changeBranch = (branch: Branch) => {
    if (branch === "composition") return false;
    const nextType = branch === "playlist" ? "playlist" : publicationType === "video" ? "video" : "image";
    if (nextType === publicationType) return true;
    if ((assetItems.length || playlistId || compositionId) && !window.confirm("Changing content type clears selected content. Schedule and Channels stay. Continue?")) return false;
    setBasicInfo({ ...basicInfo, publicationType: nextType });
    return true;
  };

  const commitMedia = (ids: string[]) => {
    const previous = new Map(assetItems.map((item) => [item.media_asset_id, item]));
    setAssetItems(ids.flatMap((id) => {
      const asset = assets.find((candidate) => candidate.id === id);
      if (!asset || !canSelectAsset(publicationType, asset)) return [];
      return [previous.get(id) ?? { media_asset_id: id, duration_seconds: isImageAsset(asset) ? DEFAULT_IMAGE_DURATION_SECONDS : null, transition: "cut" }];
    }));
    setPickerOpen(false);
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div><h1 className="text-xl font-semibold text-zinc-900">STEP 1 — CHOOSE CONTENT</h1><p className="mt-1 text-sm text-zinc-500">เลือกสิ่งที่จะสร้างหรือเผยแพร่</p></div>
      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_15rem]">
        {(Object.keys(branchCopy) as Branch[]).map((branch) => {
          const copy = branchCopy[branch];
          const selected = selectedBranch === branch;
          return <div key={branch} className={`rounded-xl border-2 p-4 ${copy.tone} ${selected ? "ring-2 ring-indigo-500/25" : ""}`}><button type="button" onClick={() => changeBranch(branch)} disabled={branch === "composition"} className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"><p className="text-base font-semibold text-zinc-900">{copy.title}</p><p className="mt-1 min-h-10 text-sm text-zinc-500">{copy.description}</p></button>{branch === "media" ? <div className="mt-4 space-y-3"><Dropzone fileInputRef={fileInputRef} onFileSelected={(file) => void uploadFile(file)} disabled={uploadPct !== null} progress={uploadPct} error={uploadError} /><button type="button" onClick={() => setPickerOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><UploadIcon className="h-4 w-4" />เลือกจาก Media Library</button></div> : branch === "playlist" ? <div className="mt-4 space-y-3"><button type="button" onClick={() => { if (changeBranch("playlist")) setPlaylistPickerOpen(true); }} className="w-full rounded-lg border border-zinc-200 px-3 py-3 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50">{playlistId ? "เปลี่ยน Playlist" : "เลือก Playlist ที่มีอยู่"}</button><a href="/media-workspace/playlists/create" target="_blank" className="block w-full rounded-lg border border-zinc-200 px-3 py-3 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50">สร้าง Playlist ใหม่ ↗</a></div> : <div className="mt-4 space-y-3"><button type="button" disabled className="w-full rounded-lg border border-zinc-200 px-3 py-3 text-left text-sm font-medium text-zinc-400">เลือก Layout ที่มีอยู่ · #81</button><button type="button" disabled className="w-full rounded-lg border border-zinc-200 px-3 py-3 text-left text-sm font-medium text-zinc-400">สร้างใหม่ · #81</button></div>}</div>;
        })}
        <aside className="rounded-xl border border-zinc-200 p-4"><h2 className="font-semibold text-zinc-900">ไม่แน่ใจว่าเลือกอะไร?</h2><p className="mt-2 text-sm text-zinc-600">เลือก Media สำหรับไฟล์เดี่ยว, Playlist สำหรับลำดับรายการ, และ Layout สำหรับหลายโซน</p><div className="mt-5 border-t border-zinc-200 pt-4"><p className="text-sm font-medium text-zinc-800">เรียนรู้เพิ่มเติม</p><a href="#" className="mt-2 inline-block text-sm font-medium text-indigo-600">ดูคู่มือการใช้งาน ↗</a></div></aside>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><LightbulbIcon className="h-4 w-4 shrink-0" />Tip: คุณสามารถเปลี่ยนประเภทเนื้อหาได้ในขั้นตอนถัดไป</div>
      {pickerOpen && <MediaPickerModal assets={assets} tags={tags} publicationType={publicationType} selectedIds={assetItems.map((item) => item.media_asset_id)} loading={assetsLoading} error={assetsError} onClose={() => setPickerOpen(false)} onSelect={commitMedia} onUpload={() => fileInputRef.current?.click()} />}
      {playlistPickerOpen && <PlaylistPickerModal selectedId={playlistId} onClose={() => setPlaylistPickerOpen(false)} onSelect={(id) => { setPlaylistId(id); setPlaylistPickerOpen(false); }} />}
    </section>
  );
}
