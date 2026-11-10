"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { profileWarranty } from "../../domain/asset-profile-display.mts";
import { ChevronDownIcon, FileTextIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { fileSize } from "../../domain/asset-profile";
import { getAssetWarranties } from "../../services/asset-profile-api";
import type { AssetDetail, AssetFile, AssetFiles, AssetWarranty } from "../../services/asset-profile-contract";
import type { AssetReadResult } from "../../services/assets-list-types";
import { useProfileRead } from "../../hooks/use-asset-profile";
import { AssetThumbnail } from "../AssetThumbnail";
import { formatDate, ProfileRows, ProfileSection, SectionLoading, SectionMessage } from "./ProfileParts";
import { ProfileFilesLoading } from "./AssetProfileLoading";
import { DisabledHint } from "./ProfileControls";

type FilesResult = { result: AssetReadResult<AssetFiles> | null; pending: boolean; reload: () => void };
type WarrantyFields = Pick<AssetWarranty, "id" | "provider" | "type" | "startDate" | "endDate" | "referenceNo" | "coverageNote" | "status">;

const disclosure = "group/disclosure";
const summaryClass = "flex min-h-8 w-fit cursor-pointer max-sm:min-h-10 list-none items-center gap-1 rounded-control text-xs font-medium text-accent-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden";

function DisclosureChevron() {
  return <ChevronDownIcon aria-hidden="true" className="size-3.5 transition-transform group-open/disclosure:rotate-180 motion-reduce:transition-none" />;
}

function FileList({ files, onRemove, disabledReason }: {
  files: AssetFile[]; onRemove?: (file: AssetFile, trigger: HTMLButtonElement) => void; disabledReason?: string;
}) {
  return (
    <ul className="divide-y divide-border">
      {files.map((file) => (
        <li key={file.fileId} className="flex min-w-0 items-center gap-3 py-2">
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-primary">
            <FileTextIcon className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            {file.url ? (
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="block text-xs font-medium leading-relaxed wrap-anywhere text-accent-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{file.filename}</a>
            ) : (
              <span className="block text-xs leading-relaxed wrap-anywhere text-foreground" title="Link unavailable">{file.filename}</span>
            )}
            <span className="block text-xs tabular-nums text-muted-foreground">{fileSize(file.sizeBytes)}</span>
          </span>
          {onRemove && (disabledReason ? (
            <DisabledHint reason={disabledReason}>
              <Button variant="outline" size="sm" disabled>Remove</Button>
            </DisabledHint>
          ) : <Button variant="outline" size="sm" onClick={(event) => onRemove(file, event.currentTarget)} aria-label={`Remove ${file.filename}`}>Remove</Button>)}
        </li>
      ))}
    </ul>
  );
}

function RetryMessage({ message, onRetry, pending }: { message: string | null; onRetry: () => void; pending?: boolean }) {
  return (
    <div className="space-y-2">
      <SectionMessage tone="error">{message}</SectionMessage>
      <Button variant="outline" size="sm" className="max-sm:h-10" disabled={pending} onClick={onRetry}>Retry</Button>
    </div>
  );
}

export function FilesSection({ files, onPhotoFailed, disposed, onAddDocument, onRemoveDocument }: {
  files: FilesResult; onPhotoFailed: () => void; disposed: boolean;
  onAddDocument: (trigger: HTMLButtonElement) => void; onRemoveDocument: (file: AssetFile, trigger: HTMLButtonElement) => void;
}) {
  const data = files.result?.ok ? files.result.data : null;
  const count = data ? data.photos.length + data.documents.length : null;
  const disabledReason = disposed ? "Disposed assets can't have their files changed."
    : files.pending || !data ? "Wait for the current files to load." : undefined;
  const addBlocked = disabledReason ?? (data && data.documents.length >= 10 ? "This asset already has 10 documents." : undefined);
  return (
    <ProfileSection title="Photos & files" meta={count ?? undefined}>
      {!data ? files.pending ? <ProfileFilesLoading /> : (
        <RetryMessage message={files.result && !files.result.ok ? files.result.message : null} onRetry={files.reload} />
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-foreground">Photos ({data.photos.length}/4)</h3>
            {data.photos.length ? (
              <ul aria-label="Photos" className="grid grid-cols-2 gap-2 @min-xs/profile-section:grid-cols-3">
                {data.photos.map((photo) => (
                  <li key={photo.fileId}>
                    <a
                      href={photo.url ?? undefined} target="_blank" rel="noopener noreferrer" aria-label={`Open ${photo.filename}`}
                      className="block rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <AssetThumbnail src={photo.thumbnailUrl ?? photo.url} alt={photo.filename} className="aspect-square w-full" iconClassName="size-6" onFailed={onPhotoFailed} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : <SectionMessage>No photos.</SectionMessage>}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-medium text-foreground">Documents ({data.documents.length}/10)</h3>
              {addBlocked ? (
                <DisabledHint reason={addBlocked}>
                  <Button variant="outline" size="sm" disabled>Add document</Button>
                </DisabledHint>
              ) : <Button variant="outline" size="sm" onClick={(event) => onAddDocument(event.currentTarget)}>Add document</Button>}
            </div>
            {data.documents.length ? <FileList files={data.documents} onRemove={onRemoveDocument} disabledReason={disabledReason} /> : <SectionMessage>No documents.</SectionMessage>}
          </div>
        </div>
      )}
    </ProfileSection>
  );
}

function warrantyDocuments(files: FilesResult, warrantyId: string) {
  return files.result?.ok ? files.result.data.warrantyDocuments.filter((document) => document.warrantyId === warrantyId) : [];
}

function WarrantyCard({ warranty, files, expiryStatus }: { warranty: WarrantyFields; files: FilesResult; expiryStatus?: NonNullable<AssetDetail["currentWarranty"]>["expiryStatus"] }) {
  const state = expiryStatus ? profileWarranty(expiryStatus) : null;
  const documents = warrantyDocuments(files, warranty.id);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-relaxed wrap-anywhere text-foreground">{warranty.provider || "Unnamed provider"}</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {formatDate(warranty.startDate)} – {warranty.endDate ? formatDate(warranty.endDate) : "no end date"}
          </p>
        </div>
        {state && <Badge variant="pill" color={state.tone}>{state.label}</Badge>}
      </div>
      <ProfileRows rows={[
        { label: "Type", value: warranty.type || "—" },
        { label: "Reference No.", value: warranty.referenceNo || "—" },
        { label: "Status", value: warranty.status || "—" },
        { label: "Coverage note", value: warranty.coverageNote || "—", wide: true },
      ]} />
      {documents.length > 0 && <FileList files={documents} />}
      {files.result && !files.result.ok && <RetryMessage message="Warranty documents could not be loaded." onRetry={files.reload} pending={files.pending} />}
    </div>
  );
}

export function WarrantySection({ context, assetId, current, files }: {
  context: string; assetId: string; current: AssetDetail["currentWarranty"]; files: FilesResult;
}) {
  const [open, setOpen] = useState(false);
  const history = useProfileRead(`${context}:${assetId}:warranties`, (signal) => getAssetWarranties(context, assetId, signal), open);
  const earlier = history.result?.ok ? history.result.data.filter((warranty) => !warranty.isCurrent) : [];
  return (
    <ProfileSection title="Warranty">
      {current ? <WarrantyCard warranty={current} files={files} expiryStatus={current.expiryStatus} /> : <SectionMessage>No current warranty is recorded.</SectionMessage>}
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
              <WarrantyCard warranty={warranty} files={files} />
            </div>
          )) : <SectionMessage>No earlier warranties.</SectionMessage>}
        </div>
      </details>
    </ProfileSection>
  );
}
