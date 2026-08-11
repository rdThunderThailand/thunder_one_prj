"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  ChevronDownIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
  SearchIcon,
  SparklesIcon,
  UploadIcon,
} from "@/components/ui/icons";
import { assetLibraryTabs } from "../mock-data";
import { AssetCard } from "./AssetCard";
import { SelectedAssetList } from "./SelectedAssetList";
import { ContentSummaryPanel } from "./ContentSummaryPanel";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import { fetchMediaAssets } from "../services/publications-api";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import {
  fetchUploadUrl,
  readVideoDuration,
  registerVideo,
  uploadToStorage,
} from "../services/upload-api";
import type { Campaign, MediaAsset } from "../types";
import { dropUnapprovedItems, isImageAsset } from "../draft-mapping";
import { acceptedAssetKind, canSelectAsset } from "../content-selection.ts";

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

export function AssetLibraryStep({ campaigns = [] }: { campaigns?: Campaign[] }) {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);
  const toggleAssetItem = usePublicationDraftStore((s) => s.toggleAssetItem);
  const publicationType = basicInfo.publicationType;

  const [aiSuggest, setAiSuggest] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">(() =>
    publicationType === "image" || publicationType === "video"
      ? publicationType
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
      const duration = isVideoFile ? await readVideoDuration(file) : null;
      const { file_id, upload_url } = await fetchUploadUrl(file);
      await uploadToStorage(upload_url, file, setUploadPct);
      const asset = await registerVideo({
        file_id,
        title: file.name,
        ...(duration ? { duration_seconds: duration } : {}),
      });
      await loadAssets();
      if (asset?.id && acceptedAssetKind(publicationType) === (isVideoFile ? "video" : "image")) {
        toggleAssetItem({ id: asset.id, isImage: !isVideoFile });
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

  return (
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
            {filtered.map((asset) => {
              const selectable = canSelectAsset(publicationType, asset);
              return (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  previewUrl={previews[asset.id]}
                  selected={assetItems.some((i) => i.media_asset_id === asset.id)}
                  onSelect={() => {
                    if (selectable) {
                      toggleAssetItem({ id: asset.id, isImage: isImageAsset(asset) });
                    }
                  }}
                  disabled={!selectable}
                />
              );
            })}
          </div>
        </Card>

        <SelectedAssetList assets={assets} previews={previews} />
      </div>

      <ContentSummaryPanel assets={assets} previews={previews} campaigns={campaigns} />
    </div>
  );
}
