"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/lovable/button";

export function ProfileAssignmentPager({ page, pageSize, total, totalPages, itemLabel, onPageChange }: {
  page: number; pageSize: number; total: number; totalPages: number;
  itemLabel: string; onPageChange: (page: number) => void;
}) {
  const pages = totalPages <= 7 ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : [...new Set([1, page - 1, page, page + 1, totalPages])].filter((value) => value >= 1 && value <= totalPages);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs">
      <p className="text-muted-foreground">
        Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} {itemLabel}
      </p>
      <nav aria-label="Assignment history pagination" className="flex flex-wrap items-center gap-1">
        <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
        </Button>
        {pages.map((number, index) => (
          <span key={number} className="flex items-center gap-1">
            {index > 0 && number - pages[index - 1] > 1 && <span aria-hidden="true">…</span>}
            <Button variant={number === page ? "primary" : "outline"} size="sm" aria-label={`Page ${number}`}
              aria-current={number === page ? "page" : undefined} onClick={() => onPageChange(number)}>
              {number}
            </Button>
          </span>
        ))}
        <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRightIcon aria-hidden="true" className="size-4" />
        </Button>
      </nav>
    </div>
  );
}
