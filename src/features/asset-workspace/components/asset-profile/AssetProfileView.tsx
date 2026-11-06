"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRightIcon, PrintIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { locationTrail } from "../../domain/asset-profile";
import { getAssetDetail, getAssetFiles } from "../../services/asset-profile-api";
import type { AssetDetail } from "../../services/asset-profile-contract";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState, NotFoundState } from "../states/states";
import {
  formatDate, formatDateTime, ProfileRows, ProfileSection, SectionLoading,
} from "./ProfileParts";
import { FilesSection, HistorySection, WarrantySection } from "./ProfileSections";
import { useAssetLabels } from "../../hooks/use-asset-labels";
import { AssetLabelsDialog } from "../asset-labels/AssetLabelsDialog";
import { ProfileHero } from "./ProfileHero";

const BACK = "/asset-workspace/assets";
// Refresh signed links a minute before they expire.
const LINK_MARGIN_MS = 60_000;

function ProfileBreadcrumb({ name }: { name?: string }) {
  const linkClass = "inline-flex min-h-8 items-center rounded-control underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring";
  return (
    <nav aria-label="Breadcrumb" className="text-2xs text-muted-foreground">
      <ol className="flex min-w-0 flex-wrap items-center gap-1">
        <li className="flex items-center gap-1">
          <Link href="/" className={linkClass}>Home</Link>
          <ChevronRightIcon aria-hidden="true" className="size-3" />
        </li>
        <li className="flex items-center gap-1">
          <Link href={BACK} className={linkClass}>Assets</Link>
          <ChevronRightIcon aria-hidden="true" className="size-3" />
        </li>
        <li aria-current="page" className="min-w-0 break-words font-semibold text-foreground">
          {name || "Asset profile"}
        </li>
      </ol>
    </nav>
  );
}

/** Asset Profile (UC-002, 05 §4.2): view only. Edit and lifecycle actions arrive with their own PRs. */
export function AssetProfileView({ context, assetId }: { context: string; assetId: string }) {
  // Detail and files load together; each part renders as soon as its own data arrives.
  const detail = useProfileRead(`${context}:${assetId}:detail`, (signal) => getAssetDetail(context, assetId, signal));
  const files = useProfileRead(`${context}:${assetId}:files`, (signal) => getAssetFiles(context, assetId, signal));
  const labels = useAssetLabels(context, assetId);

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
        <ProfileBreadcrumb />
        {status === 404 ? <NotFoundState title="Asset not found" body={message} />
          : status === 401 || status === 403 ? <AccessDeniedState body={message} />
            : <ErrorState title="Couldn't load this asset" body={message} onRetry={detail.reload} />}
      </div>
    );
  }
  const asset = detail.result?.ok ? detail.result.data : null;
  const photos = files.result?.ok ? files.result.data.photos : [];

  return (
    <div className="@container/asset-profile min-w-0 space-y-3" aria-busy={!asset}>
      <ProfileBreadcrumb name={asset?.name} />
      <ProfileHero asset={asset} photos={photos} onPhotoFailed={refreshLinks} labelAction={asset && asset.lifecycleStatus !== "Disposed" ? (
        <Button variant="outline" size="sm" className="text-accent-foreground max-sm:h-10" onClick={(event) => labels.open([
          { id: asset.id, name: asset.name, assetTag: asset.assetTag, status: asset.lifecycleStatus },
        ], event.currentTarget)}>
          <PrintIcon aria-hidden="true" className="size-4" />
          Print / Download Label
        </Button>
      ) : null} />
      <AssetLabelsDialog flow={labels} />
      <div className="grid min-w-0 items-start gap-3 @min-5xl/asset-profile:grid-cols-[minmax(0,1fr)_18rem] @min-7xl/asset-profile:grid-cols-[minmax(0,1fr)_20rem]">
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
