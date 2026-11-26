"use client";

import type { AssetFiles } from "../../services/asset-profile-contract";
import type { AssetReadResult } from "../../services/assets-list-types";

/** The current warranty's attachments on the profile card, from the files the profile already read. */
export function ProfileWarrantyFiles({ files, warrantyId }: { files: AssetReadResult<AssetFiles> | null; warrantyId: string }) {
  if (!files) return <span className="text-muted-foreground">Loading…</span>;
  if (!files.ok) return <span className="text-muted-foreground">Couldn&apos;t load attachments</span>;
  const own = files.data.warrantyDocuments.filter((file) => file.warrantyId === warrantyId);
  if (!own.length) return <span>None</span>;
  return (
    <ul className="space-y-1">
      {own.map((file) => (
        <li key={file.fileId} className="wrap-anywhere">
          {file.url ? (
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xs text-accent-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              {file.filename}
            </a>
          ) : file.filename}
        </li>
      ))}
    </ul>
  );
}
