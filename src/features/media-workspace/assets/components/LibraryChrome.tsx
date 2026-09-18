"use client";

import type { ComponentType } from "react";
import { Archive, ChevronLeft, ChevronRight, FileAudio, FileImage, FileText, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { cn } from "@/lib/utils";

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>;

/** Lovable `MediaSummary` on the counts this page really has — audio/documents
 *  are not asset kinds here yet, so those two cards stay dimmed ("Coming soon"). */
export function LibrarySummary({ total, images, videos }: { total: number; images: number; videos: number }) {
  const pct = (n: number) => (total ? `${((n / total) * 100).toFixed(1)}% of total` : "—");
  const cards: Array<{ label: string; value: string; detail: string; icon: Icon; tone: string; disabled?: boolean }> = [
    { label: "Total Files", value: total.toLocaleString(), detail: "All media", icon: Archive, tone: "text-primary bg-primary-soft" },
    { label: "Images", value: images.toLocaleString(), detail: pct(images), icon: FileImage, tone: "text-primary bg-primary-soft" },
    { label: "Videos", value: videos.toLocaleString(), detail: pct(videos), icon: FileVideo, tone: "text-primary bg-primary-soft" },
    { label: "Audio", value: "—", detail: "Coming soon", icon: FileAudio, tone: "text-success bg-success-soft", disabled: true },
    { label: "Documents", value: "—", detail: "Coming soon", icon: FileText, tone: "text-warning bg-warning-soft", disabled: true },
  ];
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Media summary">
      {cards.map((card) => (
        <article key={card.label} className={cn("flex min-h-22 items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-panel", card.disabled && "opacity-55")}>
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", card.tone)}>
            <card.icon className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground">{card.label}</p>
            <strong className="mt-1 block text-lg leading-none">{card.value}</strong>
            <span className="mt-1.5 block text-[9px] text-muted-foreground">{card.detail}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

export function LibrarySummarySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex min-h-22 items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-10 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LibraryGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Loading media">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="aspect-video animate-pulse bg-muted" />
          <div className="space-y-2 p-3">
            <div className="h-2.5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-2 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LibraryEmpty({ type }: { type: "library" | "folder" | "search" | "trash" }) {
  const [title, hint] =
    type === "library" ? ["No media yet", "Upload media to start building your library."]
    : type === "folder" ? ["This folder is empty", "Choose another folder or move media here."]
    : type === "trash" ? ["Trash is empty", "Items you move to Trash will appear here."]
    : ["No media found", "Try adjusting your search or filters."];
  return (
    <div className="grid min-h-80 place-items-center text-center">
      <div>
        <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground"><FileImage className="h-5 w-5" /></span>
        <h3 className="mt-3 text-sm font-bold">{title}</h3>
        <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

/** Lovable `MediaPagination` with a real page window; the per-page select is not ported
 *  (page size is fixed here). */
export function LibraryPagination({ page, totalPages, total, pageSize, onPage }: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[9px] text-muted-foreground">
      <span>Showing {from} to {to} of {total.toLocaleString()} items</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-3.5 w-3.5" /></Button>
        {pages.map((n) => (
          <Button key={n} variant={n === page ? "default" : "ghost"} size="icon" className="h-7 w-7 text-[9px]" onClick={() => onPage(n)} aria-current={n === page ? "page" : undefined}>{n}</Button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <>
            <span className="px-1">…</span>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[9px]" onClick={() => onPage(totalPages)}>{totalPages}</Button>
          </>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}
