"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MediaThumb } from "@/components/ui/MediaThumb";
import { CheckCircleIcon, WarningTriangleIcon } from "@/components/ui/icons";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { Campaign, MediaAsset, Tag } from "@/types/domain";
import { usePlaylistDraftStore } from "../store/usePlaylistDraftStore";
import { checkContentCompatibility } from "../content-compatibility";
import { durationPerLoopSeconds, formatDuration } from "../duration";
import { canSubmit } from "../step-validation";
import { useMemo } from "react";

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-right font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}

export function ReviewStep({
  assets,
  campaigns,
  workspaceTags,
}: {
  assets: MediaAsset[];
  campaigns: Campaign[];
  workspaceTags: Tag[];
}) {
  const draft = usePlaylistDraftStore();
  const { name, info, playback, items } = draft;

  const ids = useMemo(() => items.map((i) => i.mediaAssetId), [items]);
  const previews = usePreviewUrls(ids);
  const assetById = useMemo(() => Object.fromEntries(assets.map((a) => [a.id, a])), [assets]);
  const assetDurations = useMemo(
    () => Object.fromEntries(assets.map((a) => [a.id, a.duration_seconds])),
    [assets]
  );

  const campaignName = campaigns.find((c) => c.id === info.campaignId)?.name;
  const tagNames = (info.tags ?? []).map(
    (id) => workspaceTags.find((t) => t.id === id)?.name ?? id
  );

  const ready = canSubmit({ name, description: info.description, items, playback });

  // ADR 0019: a count, not a blocker — assets with no recorded dimensions never appear here.
  const mismatchCount = items.filter((item) => {
    const asset = assetById[item.mediaAssetId];
    return asset ? checkContentCompatibility(info.resolution, asset) !== null : false;
  }).length;

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Review Playlist
          </h2>
          <Badge color={ready ? "green" : "yellow"} variant="pill">
            {ready ? "Ready to create" : "ยังไม่พร้อม"}
          </Badge>
        </div>

        <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          1. Basic Information
        </h3>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <ReviewRow label="Playlist Name" value={name || "—"} />
          <ReviewRow label="Description" value={info.description || "—"} />
          <ReviewRow label="Campaign" value={campaignName ?? "—"} />
          <ReviewRow
            label="Tags"
            value={
              tagNames.length > 0 ? (
                <span className="flex flex-wrap justify-end gap-1">
                  {tagNames.map((t) => (
                    <Badge key={t} color="indigo" variant="pill">
                      {t}
                    </Badge>
                  ))}
                </span>
              ) : (
                "—"
              )
            }
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            2. Content & Order
          </h3>
          {items.length === 0 ? (
            <p className="text-sm text-zinc-400">ยังไม่มี media</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((item, index) => {
                const asset = assetById[item.mediaAssetId];
                return (
                  <li key={item.mediaAssetId} className="flex items-center gap-3">
                    <span className="w-5 text-xs text-zinc-400">{index + 1}</span>
                    <MediaThumb
                      url={previews.urls[item.mediaAssetId]}
                      kind={item.kind ?? asset?.kind}
                      alt={item.title ?? asset?.title ?? item.mediaAssetId}
                      className="h-10 w-14"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-900 dark:text-zinc-100">
                      {item.title ?? asset?.title ?? item.mediaAssetId}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {formatDuration(
                        item.durationSeconds ?? assetDurations[item.mediaAssetId] ?? 0
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 border-t border-zinc-100 pt-3 text-xs text-zinc-400 dark:border-zinc-800">
            {items.length} items · Duration per Loop{" "}
            {formatDuration(durationPerLoopSeconds(items, assetDurations, playback))}
          </p>
        </Card>

        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            3. Playback Settings
          </h3>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <ReviewRow label="Play Mode" value={playback.playMode ?? "—"} />
            <ReviewRow label="Repeat" value={playback.repeat ?? "—"} />
            <ReviewRow
              label="Start Playback From"
              value={playback.startFrom === "resume" ? "Resume last successful item" : "First item"}
            />
            <ReviewRow label="Media Fit" value={playback.mediaFit ?? "—"} />
            <ReviewRow label="Video Audio" value={playback.audioEnabled ? "On" : "Off"} />
            <ReviewRow
              label="Default Transition"
              value={`${playback.defaultTransition ?? "fade"} (${playback.transitionDuration ?? 1}s)`}
            />
            <ReviewRow
              label="Failure Handling"
              value={playback.failureHandling === "stop" ? "Stop and report" : "Skip and continue"}
            />
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          4. Validation Summary
        </h3>
        <div className="flex flex-col gap-2 text-sm">
          <span
            className={`flex items-center gap-2 ${ready ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"}`}
          >
            {ready ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <WarningTriangleIcon className="h-4 w-4 text-amber-500" />
            )}
            {items.length > 0 ? "มี media ครบตามที่กำหนด" : "ยังไม่มี media"}
          </span>
          <span
            className={`flex items-center gap-2 ${
              name.trim() ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"
            }`}
          >
            {name.trim() ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <WarningTriangleIcon className="h-4 w-4 text-amber-500" />
            )}
            {name.trim() ? "ตั้งชื่อ playlist แล้ว" : "ยังไม่ได้ตั้งชื่อ playlist"}
          </span>
          <span
            className={`flex items-center gap-2 ${
              mismatchCount === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"
            }`}
          >
            {mismatchCount === 0 ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <WarningTriangleIcon className="h-4 w-4 text-amber-500" />
            )}
            {mismatchCount === 0
              ? `media ทั้งหมดเข้ากับ Output Profile ${info.resolution ?? "—"}`
              : `media ${mismatchCount} รายการไม่ตรงกับ Output Profile ${info.resolution ?? "—"} — ยังสร้างได้ จอจะย่อ/ขยายให้เอง`}
          </span>
        </div>
      </Card>
    </div>
  );
}
