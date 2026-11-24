"use client";

import { useState } from "react";
import { ArrowRightIcon, ExternalLinkIcon, FolderIcon, GridIcon, ImageIcon, InfoIcon, ListIcon, PlusIcon } from "@/components/ui/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/lovable/alert-dialog";
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

const branchCopy: Record<Branch, { title: string; description: string; detail: string; border: string; selected: string; icon: string; text: string; panel: string }> = {
  media: {
    title: "MEDIA",
    description: "ไฟล์เดี่ยว (ภาพ, วิดีโอ, เสียง, HTML)",
    detail: "ใช้สำหรับเล่นแบบเดี่ยวบนหน้าจอ",
    border: "border-t1-green-100 hover:border-t1-green-300 hover:bg-t1-green-50/40",
    selected: "border-t1-green-300 bg-t1-green-50/40",
    icon: "text-t1-green-500",
    text: "text-t1-green-700",
    panel: "bg-t1-green-50/60",
  },
  playlist: {
    title: "PLAYLIST",
    description: "ลำดับการเล่นเนื้อหา",
    detail: "เล่นหลายรายการตามลำดับที่กำหนด",
    border: "border-t1-blue-100 hover:border-t1-blue-300 hover:bg-t1-blue-50/40",
    selected: "border-t1-blue-300 bg-t1-blue-50/40",
    icon: "text-t1-blue-500",
    text: "text-t1-blue-600",
    panel: "bg-t1-blue-50/60",
  },
  composition: {
    title: "LAYOUT",
    description: "ออกแบบหลายโซนและการจัดวาง",
    detail: "แบ่งหน้าจอเป็นหลายส่วนและวางเนื้อหา",
    border: "border-t1-purple-100 hover:border-t1-purple-300 hover:bg-t1-purple-50/40",
    selected: "border-t1-purple-300 bg-t1-purple-50/40",
    icon: "text-t1-purple-500",
    text: "text-t1-purple-700",
    panel: "bg-t1-purple-50/60",
  },
};

const branchTips: Record<Exclude<Branch, "media">, { heading: string; items: string[] }> = {
  playlist: { heading: "Playlist เหมาะสำหรับ", items: ["ต้องการเล่นหลายสื่อแบบต่อเนื่อง", "กำหนดลำดับและระยะเวลาได้", "ใช้งานซ้ำได้หลายหน้าจอ"] },
  composition: { heading: "Layout เหมาะสำหรับ", items: ["แบ่งหน้าจอหลายโซน (Zones)", "แสดงสื่อหลายประเภทพร้อมกัน", "เหมาะกับหน้าจอขนาดใหญ่"] },
};

const optionClass = "flex min-h-14 w-full items-center gap-3 rounded-lg border border-border bg-card px-4 text-left text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30";
const optionHint = "block text-xs font-normal text-muted-foreground";

export function AssetLibraryStep({
  assets,
  tags,
  reloadAssets,
  assetsLoading,
  assetsError,
  onContentSelected,
  busy,
}: {
  assets: MediaAsset[];
  tags: Tag[];
  reloadAssets: () => Promise<MediaAsset[]>;
  assetsLoading: boolean;
  assetsError: string | null;
  onContentSelected: () => void;
  busy: boolean;
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
  const [kindMismatch, setKindMismatch] = useState<PublicationType | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<{ nextType: PublicationType; then?: () => void } | null>(null);
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
      setKindMismatch(nextType);
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
  const applySwitch = (nextType: PublicationType, then?: () => void) => {
    setBasicInfo({ ...basicInfo, publicationType: nextType });
    then?.();
  };
  // `then` runs once the switch is applied — immediately, or after the operator confirms the dialog.
  const changeBranch = (branch: Branch, then?: () => void) => {
    const nextType: PublicationType = branch === "playlist" ? "playlist" : branch === "composition" ? "composition" : publicationType === "video" ? "video" : "image";
    if (nextType === publicationType) return then?.();
    if (assetItems.length || playlistId || compositionId) return setPendingSwitch({ nextType, then });
    applySwitch(nextType, then);
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

  const renderBranchBody = (branch: Branch) => {
    const copy = branchCopy[branch];
    if (branch === "media") {
      return (
        <>
          <Dropzone
            fileInputRef={fileInputRef}
            onFileSelected={(file) => void uploadFile(file)}
            disabled={uploadPct !== null || busy}
            progress={uploadPct}
            error={uploadError}
          />
          <button
            type="button"
            onClick={() => changeBranch("media", () => setPickerOpen(true))}
            className={optionClass}
          >
            <FolderIcon className={`h-5 w-5 ${copy.icon}`} />
            <span>
              เลือกจาก Media Library
              <span className={optionHint}>เลือกไฟล์ที่มีอยู่แล้ว</span>
            </span>
          </button>
        </>
      );
    }
    const isPlaylist = branch === "playlist";
    const tips = branchTips[branch];
    const hasSelection = isPlaylist ? playlistId : compositionId;
    const name = isPlaylist ? "Playlist" : "Layout";
    return (
      <>
        <button
          type="button"
          onClick={() => changeBranch(branch, () => (isPlaylist ? setPlaylistPickerOpen(true) : setCompositionPickerOpen(true)))}
          className={optionClass}
        >
          {isPlaylist ? <ListIcon className={`h-5 w-5 ${copy.icon}`} /> : <GridIcon className={`h-5 w-5 ${copy.icon}`} />}
          <span className="flex-1">
            {hasSelection ? `เปลี่ยน ${name}` : `เลือก ${name} ที่มีอยู่`}
            <span className={optionHint}>{isPlaylist ? "เลือกจากรายการที่มีอยู่แล้ว" : "เลือกจาก Layout ที่บันทึกไว้"}</span>
          </span>
          <ArrowRightIcon />
        </button>
        <a
          href={isPlaylist ? "/media-workspace/playlists/create" : "/media-workspace/layouts/create"}
          target="_blank"
          rel="noreferrer"
          className={optionClass}
        >
          <PlusIcon className={`h-5 w-5 ${copy.icon}`} />
          <span className="flex-1">
            สร้าง {name} ใหม่
            <span className={optionHint}>{isPlaylist ? "จัดลำดับเนื้อหาและตั้งค่าการเล่น" : "ออกแบบการจัดวางและโซนเนื้อหา"}</span>
          </span>
          <ArrowRightIcon />
        </a>
        <div className={`mt-auto rounded-lg p-3 ${copy.panel}`}>
          <p className={`flex items-center gap-2 text-sm font-semibold ${copy.text}`}>
            <InfoIcon />
            {tips.heading}
          </p>
          <ul className="mt-1.5 list-disc space-y-0.5 pl-7 text-xs text-muted-foreground">
            {tips.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </>
    );
  };

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div>
        <h1 className="text-base font-semibold text-foreground">Choose content</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{busy ? "กำลังบันทึก…" : "เลือกสิ่งที่จะสร้างหรือเผยแพร่"}</p>
      </div>
      <fieldset disabled={busy} className="mt-3 grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_18rem]">
        {(Object.keys(branchCopy) as Branch[]).map((branch) => {
          const copy = branchCopy[branch];
          const HeaderIcon = branch === "media" ? ImageIcon : branch === "playlist" ? ListIcon : GridIcon;
          return (
            <div
              key={branch}
              className={`flex flex-col rounded-xl border p-4 transition-colors ${selectedBranch === branch ? copy.selected : copy.border}`}
            >
              <button
                type="button"
                onClick={() => changeBranch(branch)}
                className="flex w-full gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <HeaderIcon className={`h-8 w-8 shrink-0 ${copy.icon}`} />
                <span>
                  <span className={`block text-base font-semibold ${copy.text}`}>{copy.title}</span>
                  <span className="block text-sm font-medium text-muted-foreground">{copy.description}</span>
                  <span className="block text-xs text-muted-foreground">{copy.detail}</span>
                </span>
              </button>
              <div className="mt-3 flex flex-1 flex-col gap-2.5">{renderBranchBody(branch)}</div>
            </div>
          );
        })}
        <aside className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">ไม่แน่ใจว่าจะเลือกอะไร?</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">นี่คือแนวทางการเลือกประเภทเนื้อหา</p>
          <div className="mt-3 space-y-3">
            <Guide icon={ImageIcon} tone="text-t1-green-500 bg-t1-green-50" title="เลือก Media เมื่อ" items={["คุณมีไฟล์เดียวที่ต้องการแสดงผล", "ต้องการใช้ไฟล์ใน Playlist หรือ Layout", "ต้องการอัปโหลดไฟล์เก็บไว้ในคลังสื่อ"]} />
            <Guide icon={ListIcon} tone="text-t1-blue-500 bg-t1-blue-50" title="เลือก Playlist เมื่อ" items={["ต้องการเล่นสื่อหลายชิ้นต่อกัน", "ต้องการกำหนดเวลา / ระยะเวลาแต่ละชิ้น", "ต้องการบริหารลำดับสื่อ"]} />
            <Guide icon={GridIcon} tone="text-t1-purple-500 bg-t1-purple-50" title="เลือก Layout เมื่อ" items={["ต้องการแบ่งหน้าจอเป็นหลายส่วน", "ต้องการแสดงสื่อหลายประเภทพร้อมกัน", "เช่น ข่าว + สภาพอากาศ + โฆษณา"]} />
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <p className="text-xs font-medium text-foreground">เรียนรู้เพิ่มเติม</p>
            <a href="#" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
              ดูคู่มือการใช้งาน <ExternalLinkIcon />
            </a>
          </div>
        </aside>
      </fieldset>
      <AlertDialog open={kindMismatch !== null} onOpenChange={(open) => { if (!open) setKindMismatch(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>เพิ่มไฟล์นี้ไม่ได้</AlertDialogTitle>
            <AlertDialogDescription>Publication นี้เป็น{publicationType === "video" ? "วิดีโอ" : "รูปภาพ"} ล้างเนื้อหาที่เลือกก่อนจึงจะเพิ่ม{kindMismatch === "video" ? "วิดีโอ" : "รูปภาพ"}ได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>รับทราบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={pendingSwitch !== null} onOpenChange={(open) => { if (!open) setPendingSwitch(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>เปลี่ยนประเภทเนื้อหา?</AlertDialogTitle>
            <AlertDialogDescription>การเปลี่ยนประเภทจะล้างเนื้อหาที่เลือกไว้ ส่วน Schedule และ Channels จะยังอยู่</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingSwitch) applySwitch(pendingSwitch.nextType, pendingSwitch.then); }}>เปลี่ยนประเภท</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {pickerOpen && <MediaPickerModal assets={assets} tags={tags} selectedIds={assetItems.map((item) => item.media_asset_id)} loading={assetsLoading} error={assetsError} onClose={() => setPickerOpen(false)} onSelect={commitMedia} />}
      {playlistPickerOpen && <PlaylistPickerModal selectedId={playlistId} onClose={() => setPlaylistPickerOpen(false)} onSelect={(id) => { setPlaylistId(id); setPlaylistPickerOpen(false); onContentSelected(); }} />}
      {compositionPickerOpen && <CompositionPickerModal selectedId={compositionId} onClose={() => setCompositionPickerOpen(false)} onSelect={(id) => { setCompositionId(id); setCompositionPickerOpen(false); onContentSelected(); }} />}
    </section>
  );
}

function Guide({ icon: Icon, tone, title, items }: { icon: typeof ImageIcon; tone: string; title: string; items: string[] }) {
  return (
    <div className="border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="flex items-center gap-2.5">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-10 text-xs leading-5 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
