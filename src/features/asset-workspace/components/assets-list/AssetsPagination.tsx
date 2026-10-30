import { Button } from "@/components/ui/lovable/button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { ASSET_PAGE_SIZES } from "../../services/assets-list-query";
import type { AssetListData } from "../../services/assets-list-types";

interface AssetsPaginationProps {
  data: AssetListData;
  pending: boolean;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  compact?: boolean;
}

function visiblePages(page: number, total: number) {
  const pages = new Set([1, total, page - 1, page, page + 1]);
  return [...pages].filter((value) => value > 0 && value <= total).sort((a, b) => a - b);
}

export function AssetsPagination({ data, pending, onPage, onPageSize, compact = false }: AssetsPaginationProps) {
  const { page, pageSize, total, totalPages, rows } = data;
  const pages = visiblePages(page, totalPages);
  const start = rows.length ? (page - 1) * pageSize + 1 : 0;
  const end = rows.length ? Math.min(start + rows.length - 1, total) : 0;

  return (
    <div className={`flex flex-wrap items-center gap-3 ${compact ? "justify-end" : "justify-between"}`}>
      {!compact && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <select
            aria-label="Assets per page"
            value={pageSize}
            disabled={pending}
            onChange={(event) => onPageSize(Number(event.target.value))}
            className="h-8 rounded-control border border-input bg-card px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {Array.from(new Set([...ASSET_PAGE_SIZES, pageSize])).sort((a, b) => a - b).map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          per page
        </label>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs tabular-nums text-muted-foreground">{start}–{end} of {total.toLocaleString("en-GB")} assets</span>
        <nav aria-label={compact ? "Top asset pagination" : "Asset pagination"} className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Previous page"
            disabled={pending || page <= 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeftIcon className="size-3" />
          </Button>
          {pages.map((value, index) => (
            <span key={value} className="hidden items-center gap-1 @2xl:inline-flex">
              {index > 0 && value - pages[index - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}
              <Button
                variant={value === page ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label={`Page ${value}`}
                aria-current={value === page ? "page" : undefined}
                disabled={pending}
                onClick={() => onPage(value)}
              >
                {value}
              </Button>
            </span>
          ))}
          <span className="text-xs tabular-nums @2xl:hidden">{page} / {Math.max(totalPages, 1)}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Next page"
            disabled={pending || page >= totalPages}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRightIcon className="size-3" />
          </Button>
        </nav>
      </div>
    </div>
  );
}
