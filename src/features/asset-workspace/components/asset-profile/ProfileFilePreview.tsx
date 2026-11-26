"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { DownloadIcon, ExpandIcon, FileTextIcon, ImageIcon, XIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";
import type { ProfileFileRow } from "../../domain/asset-profile-display.mts";
import { fileSize } from "../../domain/asset-profile";
import { formatDateTime, ProfileRows, SectionMessage } from "./ProfileParts";

const LINKED_TO = { Photo: "Asset photo", Document: "Asset document", Warranty: "Warranty document" } as const;

export function FileUploader({ uploader }: { uploader: ProfileFileRow["uploadedBy"] }) {
  if (!uploader?.name) return <span>—</span>;
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={uploader.name} size={24} />
      <span title={uploader.name} className="min-w-0 truncate">{uploader.name}</span>
    </span>
  );
}

/** Frame 06: the file sits on a muted stage under a slim bar; the browser's own PDF toolbar is hidden. */
function Preview({ file }: { file: ProfileFileRow }) {
  const [failed, setFailed] = useState(false);
  let body = <div className="grid h-full place-items-center p-4"><SectionMessage>Preview isn&apos;t available. Download the file instead.</SectionMessage></div>;
  if (file.url && !failed && file.type === "Image") {
    // eslint-disable-next-line @next/next/no-img-element -- signed Storage URL, not an optimisable static asset
    body = <img src={file.url} alt={file.filename} onError={() => setFailed(true)} className="size-full object-contain" />;
  } else if (file.url && !failed && file.type === "PDF") {
    // shortcut: the #toolbar fragment is honoured by Chromium and Firefox viewers only; Safari still shows its own controls.
    body = <iframe src={`${file.url}#toolbar=0&navpanes=0&view=FitH`} title={`Preview of ${file.filename}`} className="size-full bg-card" />;
  }
  return (
    <div className="overflow-hidden rounded-control border border-border bg-muted">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-2 py-1">
        <span className="px-1 text-2xs font-medium text-muted-foreground">{file.type} preview</span>
        {file.url && (
          <span className="flex items-center gap-0.5">
            <Button asChild variant="ghost" size="icon-sm">
              <a href={file.url} target="_blank" rel="noopener noreferrer" download={file.filename} aria-label={`Download ${file.filename}`}>
                <DownloadIcon aria-hidden="true" className="size-4" />
              </a>
            </Button>
            <Button asChild variant="ghost" size="icon-sm">
              <a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${file.filename} in a new tab`}>
                <ExpandIcon aria-hidden="true" className="size-4" />
              </a>
            </Button>
          </span>
        )}
      </div>
      <div className="aspect-[4/5] max-h-[28rem] w-full p-3">
        <div className="size-full overflow-hidden rounded-sm bg-card shadow-sm">{body}</div>
      </div>
    </div>
  );
}

export function ProfileFilePreview({ file, onClose }: { file: ProfileFileRow; onClose: () => void }) {
  const Icon = file.type === "Image" ? ImageIcon : FileTextIcon;
  return (
    <Card role="complementary" aria-label="File preview"
      className="min-w-0 space-y-3 p-4 text-xs focus-within:border-foreground/20 focus-within:shadow-float motion-reduce:transition-none">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon aria-hidden="true" className="size-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <h2 title={file.filename} className="truncate text-xs font-semibold">{file.filename}</h2>
            <p className="text-2xs tabular-nums text-muted-foreground">{fileSize(file.sizeBytes)}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close file preview" onClick={onClose}>
          <XIcon aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <Preview key={file.url} file={file} />
      <div className="space-y-1 border-t border-border pt-3">
        <h3 className="text-sm font-semibold">File Details</h3>
        <ProfileRows rows={[
          { label: "File Name", value: file.filename },
          { label: "File Type", value: file.type },
          { label: "File Size", value: fileSize(file.sizeBytes) },
          { label: "Uploaded By", value: <FileUploader uploader={file.uploadedBy} /> },
          { label: "Uploaded Date", value: formatDateTime(file.uploadedAt) },
          { label: "Linked To", value: LINKED_TO[file.linkedTo] },
        ]} />
      </div>
    </Card>
  );
}
