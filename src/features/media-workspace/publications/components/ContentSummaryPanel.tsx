"use client";

import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { EyeIcon } from "@/components/ui/icons";
import { priorities, publicationTypes } from "../mock-data";
import { publicationTypeIcons } from "./publicationTypeIcons";
import { usePublicationDraftStore } from "../store/usePublicationDraftStore";
import type { Campaign, MediaAsset } from "../types";

export function ContentSummaryPanel({
  assets,
  previews,
  campaigns,
}: {
  assets: MediaAsset[];
  previews: Record<string, string | undefined>;
  campaigns: Campaign[];
}) {
  const basicInfo = usePublicationDraftStore((s) => s.basicInfo);
  const assetItems = usePublicationDraftStore((s) => s.assetItems);

  // The preview pane shows the first selected asset; the rest are listed by SelectedAssetList.
  const firstId = assetItems[0]?.media_asset_id;
  const selectedAsset = assets.find((a) => a.id === firstId);
  const selectedFilename = selectedAsset
    ? selectedAsset.file?.original_filename ?? selectedAsset.title ?? selectedAsset.id
    : "";
  const selectedIsVideo = selectedAsset
    ? selectedAsset.kind === "video" ||
      (!selectedAsset.kind && selectedAsset.file?.mime_type?.startsWith("video/"))
    : false;
  const selectedPreviewUrl = firstId ? previews[firstId] : undefined;

  const type = publicationTypes.find((t) => t.id === basicInfo.publicationType);
  const priority = priorities.find((p) => p.id === basicInfo.priorityId);
  const campaign = campaigns.find((c) => c.id === basicInfo.campaignId);

  return (
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
  );
}
