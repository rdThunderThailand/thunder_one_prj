"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ChevronDownIcon, FileTextIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { activityLabel, fileSize, warrantyState } from "../../domain/asset-profile";
import { getAssetWarranties } from "../../services/asset-profile-api";
import type { AssetDetail, AssetFile, AssetFiles, AssetWarranty } from "../../services/asset-profile-contract";
import type { AssetReadResult } from "../../services/assets-list-types";
import { useAssetActivity, useProfileRead } from "../../hooks/use-asset-profile";
import { AssetThumbnail } from "../AssetThumbnail";
import { formatDate, formatDateTime, ProfileRows, ProfileSection, SectionLoading, SectionMessage, todayInBangkok } from "./ProfileParts";

type FilesResult = { result: AssetReadResult<AssetFiles> | null; pending: boolean; reload: () => void };
type WarrantyFields = Pick<AssetWarranty, "id" | "provider" | "type" | "startDate" | "endDate" | "referenceNo" | "coverageNote" | "status">;

const disclosure = "group/disclosure";
const summaryClass = "flex min-h-8 w-fit cursor-pointer list-none items-center gap-1 rounded-control text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden";

function DisclosureChevron() {
  return <ChevronDownIcon className="size-3.5 transition-transform group-open/disclosure:rotate-180" />;
}

function FileList({ files }: { files: AssetFile[] }) {
  return (
    <ul className="divide-y divide-border-subtle">
      {files.map((file) => (
        <li key={file.fileId} className="flex min-w-0 items-center gap-3 py-2">
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-control bg-muted text-muted-foreground">
            <FileTextIcon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            {file.url ? (
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="block text-sm wrap-anywhere text-foreground hover:text-primary hover:underline">{file.filename}</a>
            ) : (
              <span className="block text-sm wrap-anywhere text-foreground" title="Link unavailable">{file.filename}</span>
            )}
            <span className="block text-xs tabular-nums text-muted-foreground">{fileSize(file.sizeBytes)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function RetryMessage({ message, onRetry, pending }: { message: string | null; onRetry: () => void; pending?: boolean }) {
  return (
    <div className="space-y-2">
      <SectionMessage tone="error">{message}</SectionMessage>
      <Button variant="outline" size="sm" disabled={pending} onClick={onRetry}>Retry</Button>
    </div>
  );
}

export function FilesSection({ files }: { files: FilesResult }) {
  const data = files.result?.ok ? files.result.data : null;
  const count = data ? data.photos.length + data.documents.length : null;
  return (
    <ProfileSection title="Photos & files" meta={count ?? undefined}>
      {!data ? files.pending ? <SectionLoading /> : (
        <RetryMessage message={files.result && !files.result.ok ? files.result.message : null} onRetry={files.reload} />
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">Photos</h3>
            {data.photos.length ? (
              <ul aria-label="Photos" className="grid grid-cols-3 gap-2">
                {data.photos.map((photo) => (
                  <li key={photo.fileId}>
                    <a
                      href={photo.url ?? undefined} target="_blank" rel="noopener noreferrer" aria-label={`Open ${photo.filename}`}
                      className="block rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <AssetThumbnail src={photo.thumbnailUrl ?? photo.url} alt={photo.filename} className="aspect-square w-full" iconClassName="size-6" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : <SectionMessage>No photos.</SectionMessage>}
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-muted-foreground">Documents</h3>
            {data.documents.length ? <FileList files={data.documents} /> : <SectionMessage>No documents.</SectionMessage>}
          </div>
        </div>
      )}
    </ProfileSection>
  );
}

function warrantyDocuments(files: FilesResult, warrantyId: string) {
  return files.result?.ok ? files.result.data.warrantyDocuments.filter((document) => document.warrantyId === warrantyId) : [];
}

function WarrantyCard({ warranty, files, today }: { warranty: WarrantyFields; files: FilesResult; today: string }) {
  const state = warrantyState(warranty.endDate, today);
  const documents = warrantyDocuments(files, warranty.id);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold wrap-anywhere text-foreground">{warranty.provider || "Unnamed provider"}</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {formatDate(warranty.startDate)} – {warranty.endDate ? formatDate(warranty.endDate) : "no end date"}
          </p>
        </div>
        <Badge variant="pill" color={state.tone}>{state.label}</Badge>
      </div>
      <ProfileRows rows={[
        { label: "Type", value: warranty.type || "—" },
        { label: "Reference No.", value: warranty.referenceNo || "—" },
        { label: "Status", value: warranty.status || "—" },
        { label: "Coverage note", value: warranty.coverageNote || "—", wide: true },
      ]} />
      {documents.length > 0 && <FileList files={documents} />}
    </div>
  );
}

export function WarrantySection({ context, assetId, current, files }: {
  context: string; assetId: string; current: AssetDetail["currentWarranty"]; files: FilesResult;
}) {
  const [open, setOpen] = useState(false);
  const history = useProfileRead(`${context}:${assetId}:warranties`, (signal) => getAssetWarranties(context, assetId, signal), open);
  const earlier = history.result?.ok ? history.result.data.filter((warranty) => !warranty.isCurrent) : [];
  const today = todayInBangkok();
  return (
    <ProfileSection title="Warranty">
      {current ? <WarrantyCard warranty={current} files={files} today={today} /> : <SectionMessage>No current warranty is recorded.</SectionMessage>}
      <details className={`${disclosure} mt-3`} onToggle={(event) => { if (event.currentTarget.open) setOpen(true); }}>
        <summary className={summaryClass}>
          Earlier warranties
          <DisclosureChevron />
        </summary>
        <div className="mt-2 space-y-3">
          {!history.result ? <SectionLoading /> : !history.result.ok ? (
            <RetryMessage message={history.result.message} onRetry={history.reload} pending={history.pending} />
          ) : earlier.length ? earlier.map((warranty) => (
            <div key={warranty.id} className="rounded-control border border-border p-3">
              <WarrantyCard warranty={warranty} files={files} today={today} />
            </div>
          )) : <SectionMessage>No earlier warranties.</SectionMessage>}
        </div>
      </details>
    </ProfileSection>
  );
}

export function HistorySection({ context, assetId }: { context: string; assetId: string }) {
  const [open, setOpen] = useState(false);
  const activity = useAssetActivity(context, assetId, open);
  return (
    <ProfileSection title="History" meta={activity.total || undefined}>
      <details className={disclosure} onToggle={(event) => { if (event.currentTarget.open) setOpen(true); }}>
        <summary className={summaryClass}>
          <span className="group-open/disclosure:hidden">Show history</span>
          <span className="hidden group-open/disclosure:inline">Hide history</span>
          <DisclosureChevron />
        </summary>
        <div className="mt-3 space-y-3">
          {activity.entries.length > 0 && (
            <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-border">
              {activity.entries.map((entry, index) => (
                <li key={entry.id} className="relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 pl-6">
                  <span aria-hidden="true" className={`absolute top-1.5 left-0 size-[11px] rounded-full border-2 border-card ${index === 0 ? "bg-primary" : "bg-t1-gray-300"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{activityLabel(entry.action, entry.summary)}</p>
                    {entry.actorName && <p className="text-xs text-muted-foreground">by {entry.actorName}</p>}
                    {entry.reason && <p className="mt-1 text-xs wrap-anywhere text-foreground">Reason: {entry.reason}</p>}
                  </div>
                  <time dateTime={entry.at} className="text-xs tabular-nums text-muted-foreground">{formatDateTime(entry.at)}</time>
                </li>
              ))}
            </ol>
          )}
          {activity.pending && <SectionLoading />}
          {activity.error && <RetryMessage message={activity.error} onRetry={activity.retry} />}
          {!activity.pending && !activity.error && !activity.entries.length && <SectionMessage>No history yet.</SectionMessage>}
          {activity.hasMore && !activity.pending && !activity.error && (
            <Button variant="outline" size="sm" onClick={activity.loadMore}>Load more</Button>
          )}
        </div>
      </details>
    </ProfileSection>
  );
}
