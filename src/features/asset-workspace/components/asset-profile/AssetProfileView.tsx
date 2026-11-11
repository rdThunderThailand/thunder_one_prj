"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/lovable/tabs";
import { getAssetDetail, getAssetFiles } from "../../services/asset-profile-api";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { ErrorState } from "../states/ErrorState";
import { AccessDeniedState, NotFoundState } from "../states/states";
import { FilesSection, WarrantySection } from "./ProfileSections";
import { ProfileAssignmentEvents } from "../assignments/ProfileAssignmentEvents";
import { ProfileAssignmentHistory } from "../assignments/ProfileAssignmentHistory";
import { inAssignments } from "../../domain/assignment-assign";
import { ProfileHero } from "./ProfileHero";
import { ProfileRail } from "./ProfileRail";
import { ProfileOverview } from "./ProfileOverview";
import { ProfileCurrentAssignment } from "./ProfileCurrentAssignment";
import { ProfileActions, DisabledHint } from "./ProfileControls";
import { AssetProfileLoading } from "./AssetProfileLoading";
import { Button } from "@/components/ui/lovable/button";
import { AssetFilesEditDialog } from "./AssetFilesEditDialog";
import type { AssetFilesSnapshot } from "../../hooks/use-asset-files-edit";
import type { AssetFileKind } from "../../domain/asset-files-edit";
import type { ChangedAssetFiles } from "../../services/asset-files-change";
import type { AssetDetail } from "../../services/asset-profile-contract";

type FileEditorSession = { id: string; kind: AssetFileKind; removeId?: string; trigger: HTMLButtonElement; snapshot: AssetFilesSnapshot };

export function AssetProfileView({ context, assetId }: { context: string; assetId: string }) {
  const [revision, setRevision] = useState(0);
  const [known, setKnown] = useState<AssetFilesSnapshot | null>(null);
  const [editor, setEditor] = useState<FileEditorSession | null>(null);
  const view = useRef<HTMLDivElement>(null);
  const detail = useProfileRead(`${context}:${assetId}:detail:${revision}`, (signal) => getAssetDetail(context, assetId, signal));
  const files = useProfileRead(`${context}:${assetId}:files:${revision}`, (signal) => getAssetFiles(context, assetId, signal));
  const readsReady = Boolean(detail.result?.ok && files.result?.ok && !detail.pending && !files.pending);
  const viewFiles = { ...files, result: files.result?.ok || !known ? files.result : { ok: true as const, data: known.files },
    pending: files.pending || detail.pending || Boolean(known && !readsReady) };
  // Opened from Assignments: stay in that sidebar section and open on its tab (owner 2026-11-11).
  const fromAssignments = inAssignments(usePathname());
  const [tab, setTab] = useState(fromAssignments ? "assignments" : "overview");
  const expiresAt = viewFiles.result?.ok ? viewFiles.result.data.expiresAt : null;
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
  const asset = detail.result?.ok ? detail.result.data : known?.asset;
  if (!asset && !detail.result) return <AssetProfileLoading />;
  if (detail.result && !detail.result.ok && (!known || ["NOT_FOUND", "UNAUTHENTICATED", "PERMISSION_DENIED"].includes(detail.result.code ?? ""))) {
    const { code, message } = detail.result;
    return code === "NOT_FOUND" ? <NotFoundState title="Asset not found" body={message} />
      : code === "UNAUTHENTICATED" || code === "PERMISSION_DENIED" ? <AccessDeniedState body={message} />
        : <ErrorState title="Couldn't load this asset" body={message} onRetry={detail.reload} />;
  }
  if (!asset) return <AssetProfileLoading />;
  const photos = viewFiles.result?.ok ? viewFiles.result.data.photos : [];
  function openEditor(kind: AssetFileKind, trigger: HTMLButtonElement, removeId?: string) {
    if (!readsReady || !files.result?.ok || asset!.lifecycleStatus === "Disposed") return;
    setEditor({ id: crypto.randomUUID(), kind, removeId, trigger, snapshot: { asset: asset!, files: files.result.data } });
  }
  function observe(snapshot: AssetFilesSnapshot) {
    setKnown(snapshot);
    setRevision((value) => value + 1);
  }
  function saved(data: ChangedAssetFiles, baseline: AssetDetail) {
    if (!editor) return;
    const { updatedAt, ...nextFiles } = data;
    observe({ asset: { ...baseline, updatedAt }, files: nextFiles });
    setEditor(null);
  }
  function closeEditor(refresh: boolean) {
    setEditor(null);
    if (refresh) { setKnown(null); setRevision((value) => value + 1); }
  }
  return (
    <div ref={view} tabIndex={-1} className="@container/asset-profile min-w-0 space-y-3 focus-visible:outline-2 focus-visible:outline-ring">
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link href={fromAssignments ? "/asset-workspace/assignments" : "/asset-workspace/assets"} className="inline-flex min-h-8 items-center rounded-control text-accent-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">{fromAssignments ? "Assignments" : "Assets"}</Link>
        <ChevronRightIcon aria-hidden="true" className="size-3" />
        <span aria-current="page" className="min-w-0 font-medium wrap-anywhere">{asset.name}</span>
      </nav>
      {known && (detail.result && !detail.result.ok || files.result && !files.result.ok) && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border bg-muted p-3 text-xs">
          <p>The latest profile could not be refreshed. File editing is paused until fresh details and files load.</p>
          <Button variant="outline" size="sm" disabled={detail.pending || files.pending} onClick={() => { detail.reload(); files.reload(); }}>Refresh profile and files</Button>
        </div>
      )}
      <div className="grid min-w-0 items-start gap-3 @min-6xl/asset-profile:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-3">
          <ProfileHero asset={asset} photos={photos} onPhotoFailed={refreshLinks} actions={<ProfileActions context={context} asset={asset} />} />
          <Tabs value={tab} onValueChange={setTab} className="min-w-0">
            <TabsList aria-label="Asset profile sections" className="flex h-auto min-h-10 w-full flex-wrap justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
              {[
                ["overview", "Overview"], ["assignments", "Assignments"], ["location", "Location"],
                ["files", "Files"], ["warranty", "Lifecycle & Warranty"], ["history", "History"],
              ].map(([value, label]) => {
                const disabled = value === "location";
                const trigger = (
                  <TabsTrigger value={value} disabled={disabled} className="min-h-10 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-accent-foreground data-[state=active]:shadow-none motion-reduce:transition-none">
                    {label}
                  </TabsTrigger>
                );
                return disabled ? <DisabledHint key={value}>{trigger}</DisabledHint> : <span key={value}>{trigger}</span>;
              })}
            </TabsList>
            <TabsContent value="overview" className="mt-3">
              <ProfileOverview asset={asset} files={viewFiles} onPhotoFailed={refreshLinks} onPhotoEdit={(trigger) => openEditor("photo", trigger)} />
            </TabsContent>
            <TabsContent value="assignments" className="mt-3 space-y-3">
              <ProfileCurrentAssignment asset={asset} tinted />
              <ProfileAssignmentEvents key={`${context}:${assetId}:${revision}`} context={context} asset={asset} />
            </TabsContent>
            <TabsContent value="files" className="mt-3">
              <FilesSection files={viewFiles} onPhotoFailed={refreshLinks} disposed={asset.lifecycleStatus === "Disposed"}
                onAddDocument={(trigger) => openEditor("document", trigger)} onRemoveDocument={(file, trigger) => openEditor("document", trigger, file.fileId)} />
            </TabsContent>
            <TabsContent value="warranty" className="mt-3">
              <WarrantySection context={context} assetId={assetId} current={asset.currentWarranty} files={viewFiles} />
            </TabsContent>
            <TabsContent value="history" className="mt-3">
              <ProfileAssignmentHistory key={`${context}:${assetId}:${revision}`} context={context} asset={asset} />
            </TabsContent>
          </Tabs>
        </div>
        <ProfileRail asset={asset} />
      </div>
      {editor && (
        <AssetFilesEditDialog key={editor.id} context={context} snapshot={editor.snapshot} kind={editor.kind} removeId={editor.removeId}
          liveFiles={viewFiles.result?.ok ? viewFiles.result.data : editor.snapshot.files} onFailed={refreshLinks}
          onSaved={saved} onObserved={observe} onClose={closeEditor}
          restoreFocus={() => { if (editor.trigger.isConnected) editor.trigger.focus(); else view.current?.focus(); }} />
      )}
    </div>
  );
}
