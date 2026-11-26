"use client";

import Link from "next/link";
import { useState } from "react";
import { EditIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import { categoryDisplay } from "../../domain/asset-profile-display.mts";
import type { AssetDetail, AssetFiles } from "../../services/asset-profile-contract";
import type { AssetReadResult } from "../../services/assets-list-types";
import { AssetThumbnail } from "../AssetThumbnail";
import { DisabledHint } from "./ProfileControls";
import { ProfileRows, ProfileSection, SectionMessage } from "./ProfileParts";
import { ProfileCurrentAssignment } from "./ProfileCurrentAssignment";
import { ProfilePhotoLoading } from "./AssetProfileLoading";

export type ProfileFilesRead = { result: AssetReadResult<AssetFiles> | null; pending: boolean; reload: () => void };

export function ProfileEdit({ asset, onPhotoEdit, photo = false, disabledReason }: {
  asset: AssetDetail; photo?: boolean; onPhotoEdit?: (trigger: HTMLButtonElement) => void; disabledReason?: string;
}) {
  const className = "border-primary text-accent-foreground hover:border-accent-foreground hover:bg-accent max-sm:h-10";
  if (asset.lifecycleStatus === "Disposed" || disabledReason || (photo && !onPhotoEdit)) {
    return (
      <DisabledHint reason={asset.lifecycleStatus === "Disposed" ? "Disposed assets can't be edited" : disabledReason}>
        <Button disabled variant="outline" size="sm" className={className}>
          <EditIcon aria-hidden="true" className="size-4" />
          Edit
        </Button>
      </DisabledHint>
    );
  }
  return photo ? (
    <Button variant="outline" size="sm" className={className} onClick={(event) => onPhotoEdit?.(event.currentTarget)}>
      <EditIcon aria-hidden="true" className="size-4" />
      Edit
    </Button>
  ) : (
    <Button asChild variant="outline" size="sm" className={className}>
      <Link href={`/asset-workspace/assets/${encodeURIComponent(asset.id)}/edit`}>
        <EditIcon aria-hidden="true" className="size-4" />
        Edit
      </Link>
    </Button>
  );
}

export function ProfilePhotos({ asset, files, onFailed, onEdit }: {
  asset: AssetDetail; files: ProfileFilesRead; onFailed: () => void; onEdit?: (trigger: HTMLButtonElement) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const photos = files.result?.ok ? files.result.data.photos : [];
  const active = photos.find((photo) => photo.fileId === selected) ?? photos[0];
  return (
    <ProfileSection title="Asset Photo" action={<ProfileEdit asset={asset} photo onPhotoEdit={onEdit}
      disabledReason={files.pending ? "Wait for photos to finish loading." : !files.result?.ok ? "Reload the photos before editing." : undefined} />}>
      {!files.result && files.pending ? <ProfilePhotoLoading /> : files.result && !files.result.ok ? (
        <div className="space-y-2">
          <SectionMessage tone="error">{files.result.message}</SectionMessage>
          <Button variant="outline" size="sm" disabled={files.pending} onClick={files.reload}>Retry photos</Button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-between gap-2">
          {active ? (
            <a href={active.url ?? undefined} target="_blank" rel="noopener noreferrer" aria-label={`Open ${active.filename}`} className="block rounded-control focus-visible:outline-2 focus-visible:outline-ring">
              <AssetThumbnail src={active.url ?? active.thumbnailUrl} alt={active.filename} className="h-44 w-full object-contain! p-2" onFailed={onFailed} />
            </a>
          ) : (
            <div className="space-y-2">
              <AssetThumbnail src={null} className="h-44 w-full" iconClassName="size-10" />
              <SectionMessage>No photos.</SectionMessage>
            </div>
          )}
          {photos.length > 0 && (
            <div aria-label="Choose asset photo" className="grid grid-cols-4 gap-2">
              {Array.from({ length: Math.max(photos.length, 4) }, (_, index) => {
                const photo = photos[index];
                return photo ? (
                  <button key={photo.fileId} type="button" aria-label={`Show ${photo.filename}`} aria-pressed={active?.fileId === photo.fileId} onClick={() => setSelected(photo.fileId)} className="h-16 w-full rounded-control border-2 border-transparent p-0.5 transition-colors hover:border-primary/30 focus-visible:outline-2 focus-visible:outline-ring aria-pressed:border-primary motion-reduce:transition-none">
                    <AssetThumbnail src={photo.thumbnailUrl ?? photo.url} alt="" className="h-full w-full object-contain!" onFailed={onFailed} />
                  </button>
                ) : (
                  <span key={`slot-${index}`} aria-hidden="true" className="h-16 w-full rounded-control bg-muted/50" />
                );
              })}
            </div>
          )}
        </div>
      )}
    </ProfileSection>
  );
}

export function ProfileOverview({ asset, files, onPhotoFailed, onPhotoEdit }: {
  asset: AssetDetail; files: ProfileFilesRead; onPhotoFailed: () => void; onPhotoEdit?: (trigger: HTMLButtonElement) => void;
}) {
  const category = categoryDisplay(asset.categoryPath);
  return (
    <div className="space-y-3">
      <div className="grid min-w-0 items-start gap-3 @min-4xl/asset-profile:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] @min-4xl/asset-profile:items-stretch [&>div]:flex [&>div]:h-full [&>div]:flex-col">
        <ProfileSection title="General Information" action={<ProfileEdit asset={asset} />}>
          <ProfileRows rows={[
            { label: "Asset Name", value: asset.name },
            { label: "Description", value: asset.description || "—" },
            { label: "Category", value: category.category },
            { label: "Subcategory", value: category.subcategory || "—" },
            { label: "Serial Number", value: asset.serialNumber || "—" },
            { label: "Asset Tag", value: asset.assetTag },
            { label: "Notes", value: asset.notes || "—" },
          ]} />
        </ProfileSection>
        <ProfilePhotos asset={asset} files={files} onFailed={onPhotoFailed} onEdit={onPhotoEdit} />
      </div>
      <ProfileCurrentAssignment asset={asset} />
    </div>
  );
}
