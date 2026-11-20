"use client";

import { useProfileRead } from "../../hooks/use-asset-profile";
import { getAssetFiles } from "../../services/asset-profile-api";

/** The current warranty's attachments on the profile card; read here so the profile page itself stays unchanged. */
export function ProfileWarrantyFiles({ context, assetId, warrantyId }: { context: string; assetId: string; warrantyId: string }) {
  const files = useProfileRead(`${context}:${assetId}:warranty-card-files`, (signal) => getAssetFiles(context, assetId, signal));
  if (!files.result) return <span className="text-muted-foreground">Loading…</span>;
  if (!files.result.ok) return <span className="text-muted-foreground">Couldn&apos;t load attachments</span>;
  const own = files.result.data.warrantyDocuments.filter((file) => file.warrantyId === warrantyId);
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
