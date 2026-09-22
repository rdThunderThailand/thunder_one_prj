"use client";

import type { ComponentType, ReactNode } from "react";
import { ChevronLeft, ChevronRight, FileImage } from "lucide-react";
import { Button } from "@/components/ui/lovable/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/lovable/select";
import { cn } from "@/lib/utils";

export type SummaryCard = {
  label: string;
  value: string | number;
  detail?: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Icon tile colours, e.g. "text-primary bg-primary-soft". */
  tone?: string;
  disabled?: boolean;
  /** Renders the card as a button (e.g. a card that applies a filter). */
  onClick?: () => void;
};

const COLS: Record<number, string> = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "xl:grid-cols-5", 6: "xl:grid-cols-3 2xl:grid-cols-6" };
const summaryGrid = (count: number) => cn("grid gap-3 sm:grid-cols-2", COLS[Math.min(6, Math.max(3, count))]);

/** Lovable `MediaSummary` cards. */
export function LibrarySummary({ cards, label }: { cards: SummaryCard[]; label: string }) {
  return (
    <section className={summaryGrid(cards.length)} aria-label={label}>
      {cards.map((card) => {
        const Tag = card.onClick ? "button" : "article";
        return (
        <Tag key={card.label} type={card.onClick ? "button" : undefined} onClick={card.onClick} className={cn("flex min-h-22 items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-panel", card.onClick && "transition hover:border-foreground/20 hover:shadow-float", card.disabled && "opacity-55")}>
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", card.tone ?? "text-primary bg-primary-soft")}>
            <card.icon className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground">{card.label}</p>
            <strong className="mt-1 block text-lg leading-none">{typeof card.value === "number" ? card.value.toLocaleString() : card.value}</strong>
            {card.detail && <span className="mt-1.5 block text-[9px] text-muted-foreground">{card.detail}</span>}
          </div>
        </Tag>
        );
      })}
    </section>
  );
}

export function LibrarySummarySkeleton({ count }: { count: number }) {
  return (
    <div className={summaryGrid(count)} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Loading">
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

export function LibraryRowsSkeleton() {
  return (
    <div className="space-y-2 py-2" aria-label="Loading">
      {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-10 w-full animate-pulse rounded-md bg-muted" />)}
    </div>
  );
}

/** Lovable `EmptyMedia`. */
export function LibraryEmpty({ title, hint, action, tone = "muted" }: { title: string; hint?: string; action?: ReactNode; tone?: "muted" | "danger" }) {
  return (
    <div className="grid min-h-80 place-items-center text-center">
      <div>
        <span className={cn("mx-auto grid h-10 w-10 place-items-center rounded-full", tone === "danger" ? "bg-danger-soft text-danger" : "bg-muted text-muted-foreground")}><FileImage className="h-5 w-5" /></span>
        <h3 className="mt-3 text-sm font-bold">{title}</h3>
        {hint && <p className="mt-1 text-[10px] text-muted-foreground">{hint}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

/** Lovable `MediaPagination` with a real page window and optional per-page select. */
export function LibraryPagination({ page, totalPages, total, pageSize, onPage, itemLabel = "items", perPageOptions, onPageSize }: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  itemLabel?: string;
  perPageOptions?: number[];
  onPageSize?: (size: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-[9px] text-muted-foreground">
      <span>Showing {from} to {to} of {total.toLocaleString()} {itemLabel}</span>
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
        {perPageOptions && onPageSize && (
          <Select value={String(pageSize)} onValueChange={(value) => onPageSize(Number(value))}>
            <SelectTrigger className="ml-2 h-8 w-23 text-[9px]" aria-label="Items per page"><SelectValue /></SelectTrigger>
            <SelectContent>{perPageOptions.map((n) => <SelectItem key={n} value={String(n)}>{n} / page</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
