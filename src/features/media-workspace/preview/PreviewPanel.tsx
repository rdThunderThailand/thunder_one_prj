"use client";

import type { ReactNode } from "react";
import { ImageIcon } from "@/components/ui/icons";
import type { MediaAsset } from "@/types/domain";
import type { StagePreview } from "./composition-preview";
import { PreviewStage } from "./PreviewStage";

/**
 * The inline preview box (ADR 0117): heading, optional actions, the player, and one placeholder
 * for the empty / loading / error states. Controls always sit under the frame, never on the
 * picture, and real-pixel scaling stays in the modal and the full preview. The caller owns the
 * surrounding Card because a host may put other content around it.
 */
export function PreviewPanel({
  title,
  subtitle,
  actions,
  preview,
  assets,
  loading = false,
  error = false,
  emptyMessage,
  seekRequest,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  preview: StagePreview | null;
  assets: MediaAsset[];
  loading?: boolean;
  error?: boolean;
  emptyMessage: string;
  seekRequest?: { seconds: number; id: number } | null;
}) {
  const placeholder = error ? "โหลด preview ไม่สำเร็จ" : loading ? "กำลังโหลด preview…" : emptyMessage;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {preview && !error ? (
        <PreviewStage
          zones={preview.zones}
          assets={assets}
          aspectRatio={preview.aspectRatio}
          referenceResolution={preview.referenceResolution}
          background={preview.background}
          allowActualSize={false}
          seekRequest={seekRequest}
          frameViewportHeight="36vh"
        />
      ) : (
        <div className={`flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted ${error ? "text-error" : "text-muted-foreground"}`}>
          <ImageIcon className="h-7 w-7" />
          <p className="text-xs">{placeholder}</p>
        </div>
      )}
    </div>
  );
}
