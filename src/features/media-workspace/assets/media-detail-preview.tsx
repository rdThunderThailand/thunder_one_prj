"use client";

import { FileVideo, Image as ImageIcon, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import { MediaThumb } from "@/components/ui/MediaThumb";
import type { MediaAsset } from "@/types/domain";

export type Icon = ComponentType<Pick<LucideProps, "className" | "strokeWidth">>;

export function assetLabel(asset: MediaAsset) {
  return asset.title ?? asset.file?.original_filename ?? "Untitled asset";
}

export function formatBytes(bytes?: number) {
  if (bytes == null) return undefined;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB (${bytes.toLocaleString()} bytes)`;
}

export function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function formatDuration(seconds?: number | null) {
  if (seconds == null) return undefined;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

// Lovable's MediaPreview draws a static play overlay; the repo plays the real
// rendition, so a video keeps the native controls inside the same aspect frame.
export function MediaPreview({ asset, previewUrl, thumbnailUrl }: { asset: MediaAsset; previewUrl?: string; thumbnailUrl?: string }) {
  const label = assetLabel(asset);
  if (asset.kind === "video" && previewUrl) {
    return (
      <div className="relative aspect-video overflow-hidden bg-muted">
        <video src={previewUrl} controls poster={thumbnailUrl} className="h-full w-full object-contain" />
      </div>
    );
  }
  return (
    <div className="relative aspect-video overflow-hidden bg-muted">
      <MediaThumb url={previewUrl} thumbnailUrl={thumbnailUrl} kind={asset.kind} mimeType={asset.file?.mime_type} alt={label} className="h-full w-full rounded-none object-contain" />
    </div>
  );
}

export function KindIcon({ asset, className = "" }: { asset: MediaAsset; className?: string }) {
  const Ico: Icon = asset.kind === "video" ? FileVideo : ImageIcon;
  return <Ico className={className} strokeWidth={1.8} />;
}

export function SectionCard({ title, icon: Ico, rows }: { title: string; icon: Icon; rows: Array<[string, string | undefined]> }) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-panel">
      <h3 className="flex items-center gap-2 text-xs font-bold">
        <Ico className="h-4 w-4 text-primary" strokeWidth={1.8} />
        {title}
      </h3>
      <div className="mt-3 divide-y divide-border">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 py-2.5 text-[11px]">
              <span className="text-muted-foreground">{label}</span>
              <span className="break-all text-right font-semibold">{value}</span>
            </div>
          ))}
      </div>
    </article>
  );
}
