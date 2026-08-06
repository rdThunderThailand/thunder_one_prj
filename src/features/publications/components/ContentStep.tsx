"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import {
  ChevronDownIcon,
  EyeIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
  SearchIcon,
  SparklesIcon,
  UploadIcon,
  XIcon,
} from "@/components/ui/icons";
import {
  assetLibraryTabs,
  contentTabs,
  priorities,
  publicationTypes,
} from "../mock-data";
import { publicationTypeIcons } from "./publicationTypeIcons";
import { AssetCard } from "./AssetCard";
import { MediaThumb } from "./MediaThumb";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { fetchMediaAssets } from "../services/publications-api";
import { usePreviewUrls } from "../hooks/usePreviewUrls";
import {
  fetchUploadUrl,
  readVideoDuration,
  registerVideo,
  uploadToStorage,
} from "../services/upload-api";
import type { Campaign, MediaAsset } from "../types";
import { DEFAULT_IMAGE_DURATION_SECONDS, dropUnapprovedItems, isImageAsset } from "../draft-mapping";

function toPositiveInt(raw: string): number {
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) || parsed < 1 ? DEFAULT_IMAGE_DURATION_SECONDS : parsed;
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
        checked ? "bg-indigo-600" : "bg-zinc-200"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function ContentStep({ campaigns = [] }: { campaigns?: Campaign[] }) {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const setAssetItems = usePublicationDraftStore((s) => s.setAssetItems);
  const toggleAssetItem = usePublicationDraftStore((s) => s.toggleAssetItem);
  const setAssetDuration = usePublicationDraftStore((s) => s.setAssetDuration);
  const moveAssetItem = usePublicationDraftStore((s) => s.moveAssetItem);

  const isPlaylistMode = basicInfo.publicationType === "playlist";

  const [aiSuggest, setAiSuggest] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Default mirrors Publication Type (docs/adr/0009). This step only mounts while
  // step === 2, so returning to it re-runs this initializer and the default tracks
  // the current type. Every other type falls back to All Media — the media library
  // only holds image and video assets today.
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">(() =>
    basicInfo.publicationType === "image" || basicInfo.publicationType === "video"
      ? basicInfo.publicationType
      : "all"
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ponytail: promise chain, not async/await — react-hooks/set-state-in-effect follows an
  // async callee into its body and flags the setState calls even though they're post-await.
  const loadAssets = useCallback(
    () =>
      fetchMediaAssets()
        .then((data) => {
          setAssets(data);
          setError(null);
          // Drafts saved before unapproved assets became unpickable still hold one,
          // and every save retries the RPC that refuses it — drop them on sight so
          // the wizard cannot stay stuck on a selection the user can no longer see.
          const store = usePublicationDraftStore.getState();
          const kept = dropUnapprovedItems(store.assetItems, data);
          if (kept.length !== store.assetItems.length) store.setAssetItems(kept);
        })
        .catch((err) => {
          setAssets([]);
          setError(err instanceof Error ? err.message : "Failed to load assets");
        })
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  async function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;

    setUploadError(null);
    setUploadPct(0);
    try {
      const isVideoFile = file.type.startsWith("video/");
      // Images carry no intrinsic duration; media_video_register defaults one server-side
      // (migration 066). What actually airs is the per-item value chosen in the card below.
      const duration = isVideoFile ? await readVideoDuration(file) : null;
      const { file_id, upload_url } = await fetchUploadUrl(file);
      await uploadToStorage(upload_url, file, setUploadPct);
      const asset = await registerVideo({
        file_id,
        title: file.name,
        ...(duration ? { duration_seconds: duration } : {}),
      });
      await loadAssets();
      if (asset?.id) {
        if (isPlaylistMode) {
          toggleAssetItem({ id: asset.id, isImage: !isVideoFile });
        } else {
          setAssetItems([{ media_asset_id: asset.id, duration_seconds: !isVideoFile ? DEFAULT_IMAGE_DURATION_SECONDS : null }]);
        }
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadPct(null);
    }
  }

  const filtered = useMemo(() => {
    let list = assets;
    if (typeFilter !== "all") {
      list = list.filter((asset) => isImageAsset(asset) === (typeFilter === "image"));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((asset) => {
        const filename = asset.file?.original_filename ?? "";
        const title = asset.title ?? "";
        return filename.toLowerCase().includes(q) || title.toLowerCase().includes(q);
      });
    }
    return list;
  }, [assets, searchQuery, typeFilter]);

  const filteredAssetIds = useMemo(
    () => filtered.map((a) => a.id),
    [filtered]
  );
  const previews = usePreviewUrls(filteredAssetIds);

  const selectedAsset = assets.find((a) => a.id === assetItems[0]?.media_asset_id);
  const selectedFilename = selectedAsset
    ? selectedAsset.file?.original_filename ?? selectedAsset.title ?? selectedAsset.id
    : "";
  const selectedIsVideo = selectedAsset
    ? selectedAsset.kind === "video" ||
      (!selectedAsset.kind && selectedAsset.file?.mime_type?.startsWith("video/"))
    : false;
  const selectedPreviewUrl = assetItems[0]?.media_asset_id ? previews[assetItems[0].media_asset_id] : undefined;

  const type = publicationTypes.find((t) => t.id === basicInfo.publicationType);
  const priority = priorities.find((p) => p.id === basicInfo.priorityId);
  const campaign = campaigns.find((c) => c.id === basicInfo.campaignId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Content</h1>
        <p className="mt-0.5 text-sm text-zinc-500">เลือกคอนเทนต์และกำหนดรูปแบบสำหรับการเผยแพร่</p>
      </div>

      <div className="flex items-center gap-6 border-b border-zinc-200">
        {contentTabs.map((tab) => (
          <button
            key={tab.id}
            disabled={!tab.enabled}
            title={!tab.enabled ? "Not built yet" : undefined}
            className={`border-b-2 pb-2.5 text-sm font-medium transition-colors ${
              tab.enabled
                ? "border-indigo-600 text-indigo-600"
                : "cursor-not-allowed border-transparent text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[180px] flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full rounded-lg border border-zinc-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as "all" | "image" | "video")}
                  className="appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm text-zinc-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="all">All Media</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              </div>
              {["All Formats", "All Brands", "All Languages"].map((label) => (
                <div key={label} className="relative">
                  <select className="appearance-none rounded-lg border border-zinc-200 bg-white py-2 pl-3 pr-8 text-sm text-zinc-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30">
                    <option>{label}</option>
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                </div>
              ))}
              <button className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
                <FilterIcon className="h-3.5 w-3.5" /> Filters
              </button>
              <div className="ml-auto flex items-center gap-2 text-sm text-zinc-600">
                <SparklesIcon className="h-4 w-4 text-indigo-500" />
                AI Suggest
                <ToggleSwitch checked={aiSuggest} onChange={setAiSuggest} />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900">Asset Library</h2>
                <div className="mt-2 flex items-center gap-4">
                  {assetLibraryTabs.map((tab) => (
                    <button
                      key={tab.id}
                      disabled={!tab.enabled}
                      title={!tab.enabled ? "Not built yet" : undefined}
                      className={`text-sm font-medium ${
                        tab.enabled
                          ? "border-b-2 border-indigo-600 pb-1 text-indigo-600"
                          : "cursor-not-allowed pb-1 text-zinc-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-zinc-200 p-0.5">
                  <button
                    onClick={() => setView("grid")}
                    className={`rounded-md p-1.5 ${view === "grid" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400"}`}
                    aria-label="Grid view"
                  >
                    <GridIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`rounded-md p-1.5 ${view === "list" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400"}`}
                    aria-label="List view"
                  >
                    <ListIcon className="h-4 w-4" />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleFilePicked}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadPct !== null}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                >
                  <UploadIcon className="h-3.5 w-3.5" />{" "}
                  {uploadPct !== null ? `Uploading ${uploadPct}%` : "Upload Asset"}
                </button>
              </div>
            </div>

            <p className={`mb-3 text-xs ${uploadError ? "text-red-500" : "text-zinc-400"}`}>
              {loading
                ? "Loading assets…"
                : uploadError
                  ? uploadError
                  : error
                    ? error
                    : `${filtered.length} assets found`}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  previewUrl={previews[asset.id]}
                  selected={assetItems.some((i) => i.media_asset_id === asset.id)}
                  onSelect={() => {
                    const isImage = isImageAsset(asset);
                    if (isPlaylistMode) {
                      toggleAssetItem({ id: asset.id, isImage });
                    } else {
                      setAssetItems([{ media_asset_id: asset.id, duration_seconds: isImage ? DEFAULT_IMAGE_DURATION_SECONDS : null }]);
                    }
                  }}
                />
              ))}
            </div>
          </Card>

          {assetItems.length > 0 && (
            <Card className="p-4">
              <p className="mb-2 text-sm font-semibold text-zinc-900">{`${assetItems.length} Asset${assetItems.length > 1 ? "s" : ""} Selected`}</p>
              <div className="flex flex-col gap-2">
                {assetItems.map((item, index) => {
                  const asset = assets.find((a) => a.id === item.media_asset_id);
                  if (!asset) return null;
                  
                  const isImage = isImageAsset(asset);
                  const filename = asset.file?.original_filename ?? asset.title ?? asset.id;
                  const dimensions = asset.width && asset.height ? `${asset.width} x ${asset.height}` : "—";
                  const kindLabel = isImage ? "Image" : "Video";
                  const previewUrl = previews[asset.id];

                  return (
                    <div key={item.media_asset_id} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-2">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                        <MediaThumb
                          url={previewUrl}
                          kind={asset.kind}
                          mimeType={asset.file?.mime_type}
                          alt={filename}
                          className="h-full w-full"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">{filename}</p>
                        <p className="text-xs text-zinc-400">
                          {kindLabel} · {dimensions}
                        </p>
                      </div>
                      
                      {isImage && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            // ponytail: uncontrolled + clamp on blur. Bound to the store it snapped an
                            // emptied field straight back to 10, so you could never backspace and retype.
                            defaultValue={item.duration_seconds ?? DEFAULT_IMAGE_DURATION_SECONDS}
                            onBlur={(e) => {
                              const secs = toPositiveInt(e.target.value);
                              e.target.value = String(secs);
                              setAssetDuration(item.media_asset_id, secs);
                            }}
                            aria-label={`Seconds on screen for ${filename}`}
                            className="w-16 rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                          />
                          <span className="text-xs text-zinc-400">วิ</span>
                        </div>
                      )}

                      {isPlaylistMode && assetItems.length > 1 && (
                        <div className="flex flex-col gap-0.5 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => moveAssetItem(item.media_asset_id, -1)}
                            disabled={index === 0}
                            aria-label="Move up"
                            className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:hover:text-zinc-400"
                          >
                            <ChevronDownIcon className="h-4 w-4 rotate-180" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveAssetItem(item.media_asset_id, 1)}
                            disabled={index === assetItems.length - 1}
                            aria-label="Move down"
                            className="text-zinc-400 hover:text-zinc-700 disabled:opacity-30 disabled:hover:text-zinc-400"
                          >
                            <ChevronDownIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (isPlaylistMode) {
                            toggleAssetItem({ id: asset.id, isImage });
                          } else {
                            setAssetItems([]);
                          }
                        }}
                        aria-label="Remove selected asset"
                        className="shrink-0 text-zinc-400 hover:text-zinc-700 ml-2"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">Content Summary</h2>
            <button className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
              <EyeIcon className="h-3.5 w-3.5" /> Preview
            </button>
          </div>

          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-zinc-100">
            {selectedAsset && selectedPreviewUrl ? (
              selectedIsVideo ? (
                <video
                  src={selectedPreviewUrl}
                  controls
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Image
                  src={selectedPreviewUrl}
                  alt={selectedFilename}
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover"
                />
              )
            ) : !selectedAsset ? (
              <p className="text-xs text-zinc-400">No asset selected</p>
            ) : null}
          </div>

          <dl className="mt-5 space-y-3 border-t border-zinc-100 pt-4 text-sm">
            {selectedAsset && (
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500">Selected Asset</dt>
                <dd className="text-right font-medium text-zinc-900">
                  {selectedFilename}
                  {selectedAsset.approval_status === "approved" && (
                    <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                      Approved
                    </span>
                  )}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Campaign</dt>
              <dd className="font-medium text-zinc-900">{campaign?.name}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Publication Name</dt>
              <dd className="truncate pl-4 text-right font-medium text-zinc-900">{basicInfo.name}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Publication Type</dt>
              <dd className="flex items-center gap-1.5 font-medium text-zinc-900">
                <span className="h-4 w-4 text-zinc-500">{type && publicationTypeIcons[type.id]}</span>
                {type?.label}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500">Priority</dt>
              <dd className="flex items-center gap-1.5 font-medium text-zinc-900">
                <span className={`h-2 w-2 rounded-full ${priority?.color}`} />
                {priority?.label}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
