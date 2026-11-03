"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeftIcon, CalendarIcon, EditIcon, LocationIcon, TagIcon, UserIcon, WarrantyIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { locationTrail, warrantyState } from "../../domain/asset-profile";
import { getAssetDetail, getAssetFiles } from "../../services/asset-profile-api";
import type { AssetDetail, AssetFiles } from "../../services/asset-profile-contract";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { AssetThumbnail } from "../AssetThumbnail";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState, NotFoundState } from "../states/states";
import {
  ConditionValue, Fact, formatDate, formatDateTime, formatDay, ProfileRows, ProfileSection, SectionLoading, StatusValue, todayInBangkok,
} from "./ProfileParts";
import { FilesSection, HistorySection, WarrantySection } from "./ProfileSections";

const BACK = "/asset-workspace/assets";
// Refresh signed links a minute before they expire.
const LINK_MARGIN_MS = 60_000;

function BackLink() {
  return (
    <Link href={BACK} className="inline-flex w-fit items-center gap-1 rounded-control text-xs text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <ArrowLeftIcon className="size-3.5" />
      Assets
    </Link>
  );
}

/** Asset Profile (UC-002, 05 §4.2): view only. Edit and lifecycle actions arrive with their own PRs. */
export function AssetProfileView({ context, assetId }: { context: string; assetId: string }) {
  // Detail and files load together; each part renders as soon as its own data arrives.
  const detail = useProfileRead(`${context}:${assetId}:detail`, (signal) => getAssetDetail(context, assetId, signal));
  const files = useProfileRead(`${context}:${assetId}:files`, (signal) => getAssetFiles(context, assetId, signal));

  const expiresAt = files.result?.ok ? Date.parse(files.result.data.expiresAt) : NaN;
  const { reload: reloadFiles } = files;
  useEffect(() => {
    if (!Number.isFinite(expiresAt)) return;
    const timer = window.setTimeout(reloadFiles, Math.max(expiresAt - Date.now() - LINK_MARGIN_MS, 5_000));
    return () => window.clearTimeout(timer);
  }, [expiresAt, reloadFiles]);
  // An image that stops loading early (expired or revoked link) gets one fresh read per link set.
  const refreshedFor = useRef<number | null>(null);
  const refreshLinks = () => {
    if (refreshedFor.current === expiresAt) return;
    refreshedFor.current = expiresAt;
    files.reload();
  };

  if (detail.result && !detail.result.ok) {
    const { status, message } = detail.result;
    return (
      <div className="space-y-3">
        <BackLink />
        {status === 404 ? <NotFoundState title="Asset not found" body={message} />
          : status === 401 || status === 403 ? <AccessDeniedState body={message} />
            : <ErrorState title="Couldn't load this asset" body={message} onRetry={detail.reload} />}
      </div>
    );
  }
  const asset = detail.result?.ok ? detail.result.data : null;
  const photos = files.result?.ok ? files.result.data.photos : [];

  return (
    <div className="min-w-0 space-y-3" aria-busy={!asset}>
      <BackLink />
      <ProfileHero asset={asset} photos={photos} onPhotoFailed={refreshLinks} />
      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-3">
          <ProfileSection title="Details">
            {asset ? <ProfileRows rows={detailRows(asset)} /> : <SectionLoading rows={5} />}
          </ProfileSection>
          {asset ? <WarrantySection context={context} assetId={assetId} current={asset.currentWarranty} files={files} />
            : <ProfileSection title="Warranty"><SectionLoading rows={2} /></ProfileSection>}
          <HistorySection context={context} assetId={assetId} />
        </div>
        <FilesSection files={files} />
      </div>
    </div>
  );
}

function ProfileHero({ asset, photos, onPhotoFailed }: { asset: AssetDetail | null; photos: AssetFiles["photos"]; onPhotoFailed: () => void }) {
  const photo = photos[0] ?? null;
  return (
    <header className="@container rounded-card border border-border bg-card p-4 shadow-panel @3xl:p-6">
      <div className="flex flex-col gap-4 @xl:flex-row @xl:gap-6">
        <div className="relative w-fit shrink-0">
          <AssetThumbnail
            src={photo?.url ?? photo?.thumbnailUrl ?? null} alt={photo ? `Photo of ${asset?.name || "the asset"}` : ""}
            className="size-40 @3xl:size-44" iconClassName="size-14" onFailed={onPhotoFailed}
          />
          {photos.length > 1 && (
            <span className="absolute bottom-2 left-2 rounded-pill bg-card px-2 py-0.5 text-2xs font-medium tabular-nums text-foreground shadow-control">
              {photos.length} photos
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {asset ? (
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusValue status={asset.lifecycleStatus} />
                  <ConditionValue condition={asset.condition} />
                </div>
                <h1 className="text-kpi font-bold wrap-anywhere text-foreground">{asset.name || "Unnamed asset"}</h1>
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 font-medium tabular-nums text-foreground">
                    <TagIcon className="size-4 text-muted-foreground" />
                    {asset.assetTag || "No Asset Tag"}
                  </span>
                  {/* Category is taxonomy: a neutral tag, never a status colour (DS-04). */}
                  <span className="rounded-pill border border-border px-2 py-0.5 text-xs">{asset.category?.name || "Uncategorized"}</span>
                </p>
              </div>
            ) : (
              <div role="status" aria-label="Loading asset" className="w-72 max-w-full space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            )}
            <Button
              variant="outline" size="sm" aria-disabled="true" title="Editing is not available in this version"
              aria-description="Editing is not available in this version." className="cursor-not-allowed text-muted-foreground hover:bg-card"
            >
              <EditIcon className="size-4" />
              Edit
            </Button>
          </div>
          {asset ? <HeroFacts asset={asset} /> : <SectionLoading rows={2} />}
        </div>
      </div>
    </header>
  );
}

function HeroFacts({ asset }: { asset: AssetDetail }) {
  const trail = locationTrail(asset.locationPath, asset.location);
  const segments = trail ? trail.split(" › ") : [];
  const warranty = asset.currentWarranty;
  const coverage = warranty ? warrantyState(warranty.endDate, todayInBangkok()) : null;
  return (
    <dl className="grid gap-4 border-t border-border-subtle pt-4 @3xl:grid-cols-2 @6xl:grid-cols-4 @6xl:gap-6">
      <Fact
        icon={LocationIcon} label="Location"
        value={segments.at(-1) ?? "No location"}
        detail={segments.length > 1 ? segments.slice(0, -1).join(" › ") : undefined}
      />
      <Fact
        icon={UserIcon} label="Custodian"
        value={asset.custody ? asset.custody.name || "Unnamed custodian" : "Unassigned"}
        detail={asset.custody
          ? `${asset.custody.type === "person" ? "Person" : "Organizational Unit"}${asset.custody.since ? ` · since ${formatDay(asset.custody.since)}` : ""}`
          : "No active custody"}
      />
      <Fact
        icon={WarrantyIcon} label="Warranty"
        value={warranty ? warranty.provider || "Unnamed provider" : "None recorded"}
        detail={warranty && coverage ? (
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="pill" color={coverage.tone}>{coverage.label}</Badge>
            {warranty.endDate && <span className="tabular-nums">until {formatDate(warranty.endDate)}</span>}
          </span>
        ) : undefined}
      />
      <Fact
        icon={CalendarIcon} label="Registered"
        value={formatDay(asset.registrationDate)}
        detail={asset.acquisitionDate ? `Acquired ${formatDate(asset.acquisitionDate)}` : undefined}
      />
    </dl>
  );
}

function detailRows(asset: AssetDetail) {
  return [
    { label: "Asset Tag", value: asset.assetTag || "—" },
    { label: "Serial Number", value: asset.serialNumber || "—" },
    { label: "Category", value: asset.category?.name || "Uncategorized" },
    { label: "Location", value: locationTrail(asset.locationPath, asset.location) || "—" },
    { label: "Acquisition date", value: formatDate(asset.acquisitionDate) },
    { label: "Custody since", value: asset.custody ? formatDateTime(asset.custody.since) : "—" },
    { label: "Registered", value: formatDateTime(asset.registrationDate) },
    { label: "Last updated", value: formatDateTime(asset.updatedAt) },
    { label: "Description", value: asset.description || "—", wide: true },
    { label: "Notes", value: asset.notes || "—", wide: true },
  ];
}
