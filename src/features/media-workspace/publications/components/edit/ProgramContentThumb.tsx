"use client";

import { MediaThumb } from "@/components/ui/MediaThumb";
import { usePreviewUrls } from "@/hooks/usePreviewUrls";
import type { ProgramContent } from "../../program-edit";
import { ProgramPreviewButton } from "./ProgramPreviewButton";
import { useContentSummary, type ContentSummary } from "./use-content-summary";

/** The Playlist cover, or a Layout's zone plan (Layouts have no cover). */
export function ContentPicture({
  summary,
  name,
  className = "",
  isCompact = false,
}: {
  summary: ContentSummary | null;
  name: string | null;
  className?: string;
  isCompact?: boolean;
}) {
  const assetId = summary?.kind === "asset" ? summary.assetId : undefined;
  const previews = usePreviewUrls(assetId ? [assetId] : []);
  const ratio = summary?.kind === "layout" ? summary.aspectRatio.replace(":", " / ") : "16 / 9";

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border bg-muted ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {summary?.kind === "layout" &&
        summary.zones.map((zone) => (
          <div
            key={zone.id}
            className="absolute flex items-center justify-center border border-primary/40 bg-primary/10 p-1 text-center text-xs text-primary"
            style={{ left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.width}%`, height: `${zone.height}%` }}
          >
            {!isCompact && <span className="truncate">{zone.name}</span>}
          </div>
        ))}
      {assetId && (
        <MediaThumb
          url={previews.urls[assetId]}
          thumbnailUrl={previews.thumbnailUrls[assetId]}
          alt={name ?? "Program content"}
          className="h-full w-full rounded-none"
        />
      )}
      {summary?.kind === "layout" && summary.resolution && !isCompact && (
        <span className="absolute left-2 top-2 rounded bg-foreground/70 px-1.5 py-0.5 text-xs text-background">
          {summary.resolution}
        </span>
      )}
    </div>
  );
}

/** Frame 03's picture beside Program Details, with Open Preview. */
export function ProgramContentThumb({ content }: { content: ProgramContent }) {
  const { key, summary } = useContentSummary(content);

  return (
    <div className="flex flex-col gap-2">
      <ContentPicture
        summary={summary}
        name={content.name}
        className="w-full"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs text-muted-foreground">{content.name ?? "—"}</p>
        <ProgramPreviewButton
          key={key}
          content={content}
          label="Open Preview"
          size="sm"
        />
      </div>
    </div>
  );
}
