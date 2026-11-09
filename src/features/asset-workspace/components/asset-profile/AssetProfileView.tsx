"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { getAssetDetail, getAssetFiles } from "../../services/asset-profile-api";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState, NotFoundState } from "../states/states";
import { FilesSection, WarrantySection } from "./ProfileSections";
import { HistorySection } from "./ProfileHistory";
import { ProfileHero } from "./ProfileHero";
import { ProfileRail } from "./ProfileRail";
import { ProfileOverview } from "./ProfileOverview";
import { ProfileActions, DisabledHint } from "./ProfileControls";
import { AssetProfileLoading } from "./AssetProfileLoading";

export function AssetProfileView({ context, assetId }: { context: string; assetId: string }) {
  const detail = useProfileRead(`${context}:${assetId}:detail`, (signal) => getAssetDetail(context, assetId, signal));
  const files = useProfileRead(`${context}:${assetId}:files`, (signal) => getAssetFiles(context, assetId, signal));
  const [tab, setTab] = useState("overview");
  const expiresAt = files.result?.ok ? files.result.data.expiresAt : null;
  const { reload: reloadFiles } = files;
  useEffect(() => {
    if (!expiresAt) return;
    const time = Date.parse(expiresAt);
    if (!Number.isFinite(time)) return;
    const timer = window.setTimeout(reloadFiles, Math.max(time - Date.now() - 60_000, 5_000));
    return () => window.clearTimeout(timer);
  }, [expiresAt, reloadFiles]);
  const refreshedFor = useRef<string | null>(null);
  function refreshLinks() {
    if (!expiresAt || refreshedFor.current === expiresAt) return;
    refreshedFor.current = expiresAt;
    reloadFiles();
  }
  if (!detail.result) return <AssetProfileLoading />;
  if (!detail.result.ok) {
    const { code, message } = detail.result;
    return code === "NOT_FOUND" ? <NotFoundState title="Asset not found" body={message} />
      : code === "UNAUTHENTICATED" || code === "PERMISSION_DENIED" ? <AccessDeniedState body={message} />
        : <ErrorState title="Couldn't load this asset" body={message} onRetry={detail.reload} />;
  }
  const asset = detail.result.data;
  const photos = files.result?.ok ? files.result.data.photos : [];
  return (
    <div className="@container/asset-profile min-w-0 space-y-3">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link href="/asset-workspace/assets" className="inline-flex min-h-8 items-center rounded-control text-accent-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">Assets</Link>
        <ChevronRightIcon aria-hidden="true" className="size-3" />
        <span aria-current="page" className="min-w-0 font-medium wrap-anywhere">{asset.name}</span>
      </nav>
      <div className="grid min-w-0 items-start gap-3 @min-6xl/asset-profile:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-3">
          <ProfileHero asset={asset} photos={photos} onPhotoFailed={refreshLinks} actions={<ProfileActions context={context} asset={asset} />} />
          <Tabs value={tab} onValueChange={setTab} className="min-w-0">
            <TabsList aria-label="Asset profile sections" className="flex h-auto min-h-10 w-full flex-wrap justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
              {[
                ["overview", "Overview"], ["assignments", "Assignments"], ["location", "Location"],
                ["files", "Files"], ["warranty", "Lifecycle & Warranty"], ["history", "History"],
              ].map(([value, label]) => {
                const disabled = value === "assignments" || value === "location";
                const trigger = (
                  <TabsTrigger value={value} disabled={disabled} className="min-h-10 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-accent-foreground data-[state=active]:shadow-none motion-reduce:transition-none">
                    {label}
                  </TabsTrigger>
                );
                return disabled ? <DisabledHint key={value}>{trigger}</DisabledHint> : <span key={value}>{trigger}</span>;
              })}
            </TabsList>
            <TabsContent value="overview" className="mt-3">
              <ProfileOverview asset={asset} files={files} onPhotoFailed={refreshLinks} />
            </TabsContent>
            <TabsContent value="files" className="mt-3">
              <FilesSection files={files} onPhotoFailed={refreshLinks} />
            </TabsContent>
            <TabsContent value="warranty" className="mt-3">
              <WarrantySection context={context} assetId={assetId} current={asset.currentWarranty} files={files} />
            </TabsContent>
            <TabsContent value="history" className="mt-3">
              <HistorySection context={context} assetId={assetId} />
            </TabsContent>
          </Tabs>
        </div>
        <ProfileRail asset={asset} />
      </div>
    </div>
  );
}
