"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const selectedAssetId = usePublicationDraftStore((s) => s.assetId);
  const selectAsset = usePublicationDraftStore((s) => s.setAssetId);
  const [aiSuggest, setAiSuggest] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
      const duration = isVideoFile ? await readVideoDuration(file) : 10;
      const { file_id, upload_url } = await fetchUploadUrl(file);
      await uploadToStorage(upload_url, file, setUploadPct);
      const asset = await registerVideo({
        file_id,
        title: file.name,
        ...(duration ? { duration_seconds: duration } : {}),
      });
      await loadAssets();
      if (asset?.id) {
        selectAsset(asset.id);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadPct(null);
    }
  }

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return assets;
    const q = searchQuery.toLowerCase();
    return assets.filter((asset) => {
      const filename = asset.file?.original_filename ?? "";
      const title = asset.title ?? "";
      return filename.toLowerCase().includes(q) || title.toLowerCase().includes(q);
    });
  }, [assets, searchQuery]);

  const filteredAssetIds = useMemo(
    () => filtered.map((a) => a.id),
    [filtered]
  );
  const previews = usePreviewUrls(filteredAssetIds);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId);
  const selectedFilename = selectedAsset
    ? selectedAsset.file?.original_filename ?? selectedAsset.title ?? selectedAsset.id
    : "";
  const selectedIsVideo = selectedAsset
    ? selectedAsset.kind === "video" ||
      (!selectedAsset.kind && selectedAsset.file?.mime_type?.startsWith("video/"))
    : false;
  const selectedKindLabel = selectedIsVideo ? "Video" : "Image";
  const selectedDimensions = selectedAsset
    ? selectedAsset.width && selectedAsset.height
      ? `${selectedAsset.width} x ${selectedAsset.height}`
      : "—"
    : "";
  const selectedPreviewUrl = selectedAssetId ? previews[selectedAssetId] : undefined;

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
              {["All Types", "All Formats", "All Brands", "All Languages"].map((label) => (
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
                  selected={asset.id === selectedAssetId}
                  onSelect={() => selectAsset(asset.id)}
                />
              ))}
            </div>
          </Card>

          {selectedAsset && (
            <Card className="p-4">
              <p className="mb-2 text-sm font-semibold text-zinc-900">1 Asset Selected</p>
              <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-2">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                  <MediaThumb
                    url={selectedPreviewUrl}
                    kind={selectedAsset.kind}
                    mimeType={selectedAsset.file?.mime_type}
                    alt={selectedFilename}
                    className="h-full w-full"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{selectedFilename}</p>
                  <p className="text-xs text-zinc-400">
                    {selectedKindLabel} · {selectedDimensions}
                  </p>
                </div>
                <button
                  onClick={() => selectAsset("")}
                  aria-label="Remove selected asset"
                  className="shrink-0 text-zinc-400 hover:text-zinc-700"
                >
                  <XIcon className="h-4 w-4" />
                </button>
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
                <img
                  src={selectedPreviewUrl}
                  alt={selectedFilename}
                  loading="lazy"
                  className="h-full w-full object-cover"
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
