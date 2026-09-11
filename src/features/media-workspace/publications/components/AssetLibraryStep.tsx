"use client";

import { useState } from "react";
import { ArrowRightIcon, ExternalLinkIcon, FolderIcon, GridIcon, ImageIcon, InfoIcon, LightbulbIcon, ListIcon, PlusIcon } from "@/components/ui/icons";
import { useAssetUpload } from "@/features/media-workspace/assets/useAssetUpload";
import type { MediaAsset, PublicationType, Tag } from "../types";
import { DEFAULT_IMAGE_DURATION_SECONDS, isImageAsset } from "../draft-mapping";
import { assetKind } from "../asset-filter";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { Dropzone } from "./Dropzone";
import { MediaPickerModal } from "./MediaPickerModal";
import { PlaylistPickerModal } from "./PlaylistPickerModal";
import { CompositionPickerModal } from "./CompositionPickerModal";

type Branch = "media" | "playlist" | "composition";

const branchCopy: Record<Branch, { title: string; description: string; detail: string; tone: string; text: string; panel: string }> = {
  media: { title: "MEDIA", description: "ไฟล์เดี่ยว (ภาพ, วิดีโอ, เสียง, HTML)", detail: "ใช้สำหรับเล่นแบบเดี่ยวบนหน้าจอ", tone: "border-emerald-300", text: "text-emerald-600", panel: "bg-emerald-50/60" },
  playlist: { title: "PLAYLIST", description: "ลำดับการเล่นเนื้อหา", detail: "เล่นหลายรายการตามลำดับที่กำหนด", tone: "border-blue-300", text: "text-blue-600", panel: "bg-blue-50/60" },
  composition: { title: "LAYOUT", description: "ออกแบบหลายโซนและการจัดวาง", detail: "แบ่งหน้าจอเป็นหลายส่วนและวางเนื้อหา", tone: "border-violet-300", text: "text-violet-600", panel: "bg-violet-50/60" },
};

export function AssetLibraryStep({
  assets,
  tags,
  reloadAssets,
  assetsLoading,
  assetsError,
  onContentSelected,
}: {
  assets: MediaAsset[];
  tags: Tag[];
  reloadAssets: () => Promise<MediaAsset[]>;
  assetsLoading: boolean;
  assetsError: string | null;
  onContentSelected: () => void;
}) {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const playlistId = usePublicationDraftStore((s) => s.playlistId);
  const compositionId = usePublicationDraftStore((s) => s.compositionId);
  const setBasicInfo = usePublicationDraftStore((s) => s.setBasicInfo);
  const setAssetItems = usePublicationDraftStore((s) => s.setAssetItems);
  const setPlaylistId = usePublicationDraftStore((s) => s.setPlaylistId);
  const setCompositionId = usePublicationDraftStore((s) => s.setCompositionId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [playlistPickerOpen, setPlaylistPickerOpen] = useState(false);
  const [compositionPickerOpen, setCompositionPickerOpen] = useState(false);
  const publicationType = basicInfo.publicationType;

  const { fileInputRef, uploadPct, uploadError, uploadFile } = useAssetUpload(async (asset, isVideoFile) => {
    const refreshed = await reloadAssets();
    const selected = refreshed.find((candidate) => candidate.id === asset?.id) ?? asset;
    if (!selected) return;
    // First asset in the branch decides image vs video; a later upload of the other kind is
    // refused with a reason rather than silently dropped (single-kind publications, ADR 0049 §5).
    const nextType: PublicationType = isVideoFile ? "video" : "image";
    if (assetItems.length === 0) {
      if (publicationType !== nextType) setBasicInfo({ ...basicInfo, publicationType: nextType });
    } else if (publicationType !== nextType) {
      window.alert(`Publication นี้เป็น ${publicationType === "video" ? "วิดีโอ" : "รูปภาพ"} — ล้างเนื้อหาที่เลือกก่อนจึงจะเพิ่ม${nextType === "video" ? "วิดีโอ" : "รูปภาพ"}ได้`);
      return;
    }
    setAssetItems(assetItems.some((item) => item.media_asset_id === selected.id) ? assetItems : [...assetItems, {
      media_asset_id: selected.id,
      duration_seconds: isVideoFile ? null : DEFAULT_IMAGE_DURATION_SECONDS,
      transition: "cut",
    }]);
    onContentSelected();
  });

  const selectedBranch: Branch = publicationType === "playlist" ? "playlist" : publicationType === "composition" ? "composition" : "media";
  const changeBranch = (branch: Branch) => {
    const nextType = branch === "playlist" ? "playlist" : branch === "composition" ? "composition" : publicationType === "video" ? "video" : "image";
    if (nextType === publicationType) return true;
    if ((assetItems.length || playlistId || compositionId) && !window.confirm("Changing content type clears selected content. Schedule and Channels stay. Continue?")) return false;
    setBasicInfo({ ...basicInfo, publicationType: nextType });
    return true;
  };

  const commitMedia = (ids: string[]) => {
    const firstAsset = ids.flatMap((id) => assets.find((candidate) => candidate.id === id) ?? [])[0];
    const nextType: PublicationType = firstAsset ? assetKind(firstAsset) : publicationType;
    if (nextType !== publicationType) setBasicInfo({ ...basicInfo, publicationType: nextType });
    const previous = new Map(assetItems.map((item) => [item.media_asset_id, item]));
    setAssetItems(ids.flatMap((id) => {
      const asset = assets.find((candidate) => candidate.id === id);
      if (!asset || assetKind(asset) !== nextType) return [];
      return [previous.get(id) ?? { media_asset_id: id, duration_seconds: isImageAsset(asset) ? DEFAULT_IMAGE_DURATION_SECONDS : null, transition: "cut" }];
    }));
    setPickerOpen(false);
    onContentSelected();
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div><h1 className="text-xl font-semibold text-zinc-900">STEP 1 — CHOOSE CONTENT</h1><p className="mt-1 text-sm text-zinc-500">เลือกสิ่งที่จะสร้างหรือเผยแพร่</p></div>
      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_16rem]">
        {(Object.keys(branchCopy) as Branch[]).map((branch) => {
          const copy = branchCopy[branch];
          const selected = selectedBranch === branch;
          const HeaderIcon = branch === "media" ? ImageIcon : branch === "playlist" ? ListIcon : GridIcon;
          return <div key={branch} className={`flex min-h-[31rem] flex-col rounded-xl border-2 p-5 ${copy.tone} ${selected ? "ring-2 ring-indigo-500/25" : ""}`}>
            <button type="button" onClick={() => changeBranch(branch)} className="flex w-full gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
              <HeaderIcon className={`h-12 w-12 shrink-0 ${copy.text}`} />
              <span><span className={`block text-xl font-bold ${copy.text}`}>{copy.title}</span><span className="mt-1 block text-sm font-medium text-zinc-700">{copy.description}</span><span className="mt-1 block text-sm text-zinc-500">{copy.detail}</span></span>
            </button>
            {branch === "media" ? <div className="mt-5 flex flex-1 flex-col gap-3"><Dropzone fileInputRef={fileInputRef} onFileSelected={(file) => void uploadFile(file)} disabled={uploadPct !== null} progress={uploadPct} error={uploadError} /><button type="button" onClick={() => { if (changeBranch("media")) setPickerOpen(true); }} className="flex min-h-16 w-full items-center gap-4 rounded-lg border border-zinc-200 bg-white px-5 text-left text-sm font-semibold text-zinc-800 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><FolderIcon className="h-6 w-6 text-emerald-600" /><span>เลือกจาก Media Library<span className="mt-1 block text-xs font-normal text-zinc-500">เลือกไฟล์ที่มีอยู่แล้ว</span></span></button><div className="mt-auto"><p className="text-sm font-semibold text-zinc-700">รองรับไฟล์</p><div className="mt-2 flex flex-wrap gap-1.5">{["Image", "Video", "Audio", "HTML", "MP4", "JPG", "PNG"].map((type) => <span key={type} className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">{type}</span>)}</div></div></div> : branch === "playlist" ? <div className="mt-5 flex flex-1 flex-col gap-4"><button type="button" onClick={() => { if (changeBranch("playlist")) setPlaylistPickerOpen(true); }} className="flex min-h-20 w-full items-center gap-4 rounded-lg border border-zinc-200 bg-white px-5 text-left text-sm font-semibold text-zinc-800 hover:bg-zinc-50"><ListIcon className="h-8 w-8 text-blue-600" /><span className="flex-1">{playlistId ? "เปลี่ยน Playlist" : "เลือก Playlist ที่มีอยู่"}<span className="mt-1 block text-xs font-normal text-zinc-500">เลือกจากรายการที่มีอยู่แล้ว</span></span><ArrowRightIcon /></button><a href="/media-workspace/playlists/create" target="_blank" rel="noreferrer" className="flex min-h-20 w-full items-center gap-4 rounded-lg border border-zinc-200 bg-white px-5 text-left text-sm font-semibold text-zinc-800 hover:bg-zinc-50"><PlusIcon className="h-8 w-8 text-blue-600" /><span className="flex-1">สร้าง Playlist ใหม่<span className="mt-1 block text-xs font-normal text-zinc-500">จัดลำดับเนื้อหาและตั้งค่าการเล่น</span></span><ArrowRightIcon /></a><div className={`mt-auto rounded-lg p-4 ${copy.panel}`}><p className={`flex items-center gap-2 text-sm font-semibold ${copy.text}`}><InfoIcon />Playlist เหมาะสำหรับ</p><ul className="mt-2 list-disc space-y-1 pl-7 text-xs text-zinc-600"><li>ต้องการเล่นหลายสื่อแบบต่อเนื่อง</li><li>กำหนดลำดับและระยะเวลาได้</li><li>ใช้งานซ้ำได้หลายหน้าจอ</li></ul></div></div> : <div className="mt-5 flex flex-1 flex-col gap-4"><button type="button" onClick={() => { if (changeBranch("composition")) setCompositionPickerOpen(true); }} className="flex min-h-20 w-full items-center gap-4 rounded-lg border border-zinc-200 bg-white px-5 text-left text-sm font-semibold text-zinc-800 hover:bg-zinc-50"><GridIcon className="h-8 w-8 text-violet-600" /><span className="flex-1">{compositionId ? "เปลี่ยน Layout" : "เลือก Layout ที่มีอยู่"}<span className="mt-1 block text-xs font-normal text-zinc-500">เลือกจาก Layout ที่บันทึกไว้</span></span><ArrowRightIcon /></button><a href="/media-workspace/layouts/create" target="_blank" rel="noreferrer" className="flex min-h-20 w-full items-center gap-4 rounded-lg border border-zinc-200 bg-white px-5 text-left text-sm font-semibold text-zinc-800 hover:bg-zinc-50"><PlusIcon className="h-8 w-8 text-violet-600" /><span className="flex-1">สร้าง Layout ใหม่<span className="mt-1 block text-xs font-normal text-zinc-500">ออกแบบการจัดวางและโซนเนื้อหา</span></span><ArrowRightIcon /></a><div className={`mt-auto rounded-lg p-4 ${copy.panel}`}><p className={`flex items-center gap-2 text-sm font-semibold ${copy.text}`}><InfoIcon />Layout เหมาะสำหรับ</p><ul className="mt-2 list-disc space-y-1 pl-7 text-xs text-zinc-600"><li>แบ่งหน้าจอหลายโซน (Zones)</li><li>แสดงสื่อหลายประเภทพร้อมกัน</li><li>เหมาะกับหน้าจอขนาดใหญ่</li></ul></div></div>}
          </div>;
        })}
        <aside className="rounded-xl border border-zinc-200 p-5"><h2 className="text-lg font-semibold text-zinc-900">ไม่แน่ใจว่าจะเลือกอะไร?</h2><p className="mt-1 text-sm text-zinc-500">นี่คือแนวทางการเลือกประเภทเนื้อหา</p><div className="mt-5 space-y-5"><Guide icon={ImageIcon} tone="text-emerald-600 bg-emerald-50" title="เลือก Media เมื่อ" items={["คุณมีไฟล์เดียวที่ต้องการแสดงผล", "ต้องการใช้ไฟล์ใน Playlist หรือ Layout", "ต้องการอัปโหลดไฟล์เก็บไว้ในคลังสื่อ"]} /><Guide icon={ListIcon} tone="text-blue-600 bg-blue-50" title="เลือก Playlist เมื่อ" items={["ต้องการเล่นสื่อหลายชิ้นต่อกัน", "ต้องการกำหนดเวลา / ระยะเวลาแต่ละชิ้น", "ต้องการบริหารลำดับสื่อ"]} /><Guide icon={GridIcon} tone="text-violet-600 bg-violet-50" title="เลือก Layout เมื่อ" items={["ต้องการแบ่งหน้าจอเป็นหลายส่วน", "ต้องการแสดงสื่อหลายประเภทพร้อมกัน", "เช่น ข่าว + สภาพอากาศ + โฆษณา"]} /></div><div className="mt-5 border-t border-zinc-200 pt-4"><p className="text-sm font-medium text-zinc-800">เรียนรู้เพิ่มเติม</p><a href="#" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">ดูคู่มือการใช้งาน <ExternalLinkIcon /></a></div></aside>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><LightbulbIcon className="h-4 w-4 shrink-0" />Tip: คุณสามารถเปลี่ยนประเภทเนื้อหาได้ในขั้นตอนถัดไป</div>
      {pickerOpen && <MediaPickerModal assets={assets} tags={tags} selectedIds={assetItems.map((item) => item.media_asset_id)} loading={assetsLoading} error={assetsError} onClose={() => setPickerOpen(false)} onSelect={commitMedia} />}
      {playlistPickerOpen && <PlaylistPickerModal selectedId={playlistId} onClose={() => setPlaylistPickerOpen(false)} onSelect={(id) => { setPlaylistId(id); setPlaylistPickerOpen(false); onContentSelected(); }} />}
      {compositionPickerOpen && <CompositionPickerModal selectedId={compositionId} onClose={() => setCompositionPickerOpen(false)} onSelect={(id) => { setCompositionId(id); setCompositionPickerOpen(false); onContentSelected(); }} />}
    </section>
  );
}

function Guide({ icon: Icon, tone, title, items }: { icon: typeof ImageIcon; tone: string; title: string; items: string[] }) {
  return <div className="border-b border-zinc-100 pb-5 last:border-0 last:pb-0"><div className="flex items-center gap-3"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tone}`}><Icon className="h-5 w-5" /></span><p className="text-sm font-semibold text-zinc-800">{title}</p></div><ul className="mt-2 list-disc space-y-1 pl-12 text-xs leading-5 text-zinc-600">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}
